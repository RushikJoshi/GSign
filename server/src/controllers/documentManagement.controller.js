import crypto from "crypto";
import axios from "axios";
import fs from "fs";
import path from "path";
import { promises as fsp } from "fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { DocumentAuditLog } from "../models/documentAuditLog.model.js";
import { Document } from "../models/document.model.js";
import { Signer } from "../models/signer.model.js";
import { uploadToCloudinary } from "../utils/cloudinaryUtils.js";
import { sendEmail } from "../utils/sendEmail.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIGN_LINK_EXPIRY_HOURS = Number(process.env.SIGN_LINK_EXPIRY_HOURS || 72);
const REMINDER_BATCH_LIMIT = Number(process.env.REMINDER_BATCH_LIMIT || 50);

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const createSignerToken = () => crypto.randomBytes(32).toString("hex");
const getSignerAppBaseUrl = () =>
  process.env.SIGNING_APP_BASE_URL || process.env.APP_BASE_URL || "http://localhost:5173";
const CERTIFICATES_DIR = path.join(process.cwd(), "uploads", "certificates");
const SIGNED_DIR = path.join(process.cwd(), "uploads", "signed");

const isDocumentExpiredByDate = (document) => {
  if (!document?.expiryDate) return false;
  return new Date(document.expiryDate).getTime() < Date.now();
};

const syncDocumentSigners = async (documentId) => {
  const document = await Document.findById(documentId);
  if (!document) return;
  const signers = await Signer.find({ document: documentId }).sort({ signingOrder: 1 });
  document.signers = signers.map(s => ({
    name: s.name,
    email: s.email,
    order: s.signingOrder,
    status: s.status === "signed" || s.status === "completed" ? "signed" : "pending",
    isActive: s.isActive,
    signedAt: s.signedAt,
    viewedAt: s.viewedAt,
    emailedAt: s.emailSentAt || s.createdAt
  }));
  await document.save();
};

const getDerivedDocumentStatus = (docSigners, document = null) => {
  if (document && document.status === "completed") {
    return "completed";
  }
  
  if (document && isDocumentExpiredByDate(document)) {
    return "expired";
  }

  const now = Date.now();
  const pendingInOrder = [...docSigners]
    .filter((s) => s.status !== "signed" && s.status !== "completed")
    .sort((a, b) => a.signingOrder - b.signingOrder);

  const activeSigner = pendingInOrder[0] || null;
  if (activeSigner && activeSigner.tokenExpiresAt && activeSigner.tokenExpiresAt.getTime() < now) {
    return "expired";
  }

  if (docSigners.length > 0 && docSigners.every((s) => s.status === "signed" || s.status === "completed")) {
    return "completed";
  }
  if (docSigners.some((s) => s.status === "signed" || s.status === "completed")) {
    return "pending";
  }
  return "sent";
};

const detectDeviceType = (userAgent = "") => {
  const ua = String(userAgent || "").toLowerCase();
  if (!ua) return "unknown";
  if (ua.includes("bot") || ua.includes("spider") || ua.includes("crawler")) return "bot";
  if (ua.includes("ipad") || ua.includes("tablet")) return "tablet";
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) return "mobile";
  return "desktop";
};

const logAuditEvent = async ({
  documentId,
  signerEmail = null,
  eventType,
  req = null,
  metadata = {},
}) => {
  await DocumentAuditLog.create({
    document: documentId,
    signerEmail,
    eventType,
    eventAt: new Date(),
    ipAddress: req?.ip || null,
    deviceType: detectDeviceType(req?.headers?.["user-agent"]),
    userAgent: req?.headers?.["user-agent"] || "",
    metadata,
  });
};

const buildCertificateTimelineRows = (logs = []) =>
  logs.map(
    (log) =>
      `${new Date(log.eventAt).toISOString()} | ${log.eventType.toUpperCase()} | ${log.signerEmail || "-"} | ${log.ipAddress || "-"} | ${log.deviceType}`
  );

const createCertificatePdf = async ({ document, signers, timelineLogs }) => {
  await fsp.mkdir(CERTIFICATES_DIR, { recursive: true });
  const pdfDoc = await PDFDocument.create();
  
  // High-fidelity A4 Layout
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const company = await Company.findById(document.company);
  const owner = await Document.findById(document._id).populate("uploadedBy");
  const senderInfo = owner?.uploadedBy ? `${owner.uploadedBy.name} <${owner.uploadedBy.email}>` : "N/A";

  const blueBranding = rgb(0.18, 0.58, 0.88);
  const textGray = rgb(0.4, 0.4, 0.4);
  const textDark = rgb(0.15, 0.15, 0.15);

  let y = height - 40;
  const margin = 40;

  // 1. Header (Brand and Generated Date)
  page.drawText("Zoho", { x: margin, y, size: 14, font: bold, color: rgb(0.1, 0.4, 0.8) });
  page.drawText("Sign", { x: margin + 35, y, size: 14, font: bold, color: textDark });
  
  const genDate = `Generated on ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} IST`;
  page.drawText(genDate, {
    x: width - margin - (font.widthOfTextAtSize(genDate, 9)),
    y,
    size: 9,
    font,
    color: textGray
  });

  y -= 45;
  // 2. Main Title
  const title = "Certificate of Completion";
  const titleWidth = bold.widthOfTextAtSize(title, 24);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y,
    size: 24,
    font: bold,
    color: blueBranding
  });

  y -= 30;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7)
  });

  y -= 40;
  // 3. Summary Section
  page.drawText("Summary", { x: margin, y, size: 20, font: bold, color: blueBranding });
  
  y -= 25;
  const drawSummaryField = (label, value, xOffset = 0, yPos = y) => {
    page.drawText(label, { x: margin + xOffset, y: yPos, size: 10, font: bold, color: textDark });
    const valText = String(value || "N/A");
    const labelWidth = bold.widthOfTextAtSize(label, 10);
    
    // Aligned value display
    let valX = margin + xOffset + 100;
    if (labelWidth > 90) valX = margin + xOffset + labelWidth + 10;

    page.drawText(valText, { x: valX, y: yPos, size: 10, font, color: textGray });
  };

  const rightColX = 320;

  // Left Column fields
  drawSummaryField("Document ID:", String(document._id).toUpperCase());
  y -= 18;
  drawSummaryField("Document name:", document.title);
  y -= 18;
  drawSummaryField("Sent by:", senderInfo);
  y -= 18;
  drawSummaryField("Organization:", company?.name || "Gitakshmi Technologies Private Limited");
  if (company?.address) {
    y -= 12;
    const addrLines = company.address.split(',').map(s => s.trim());
    page.drawText(addrLines.slice(0, 3).join(', '), { x: margin + 100, y, size: 9, font, color: textGray });
    y -= 11;
    page.drawText(addrLines.slice(3).join(', '), { x: margin + 100, y, size: 9, font, color: textGray });
  }
  y -= 18;
  drawSummaryField("Sent on:", new Date(document.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + " IST");
  y -= 18;
  drawSummaryField("Completed on:", document.status === 'completed' ? new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + " IST" : "In Progress");
  y -= 18;
  drawSummaryField("Sign order:", document.signingMode?.toUpperCase() || "PARALLEL");
  y -= 18;
  drawSummaryField("No. of documents:", "1");
  y -= 18;
  drawSummaryField("Time zone:", "Asia/Kolkata (GMT+05:30)");

  // Right Column stats (Parallel to summary fields)
  let statsY = height - 180;
  const drawStat = (label, val) => {
    page.drawText(label, { x: margin + rightColX, y: statsY, size: 10, font: bold, color: textDark });
    page.drawText(String(val || "0"), { x: margin + rightColX + 110, y: statsY, size: 10, font, color: textGray });
    statsY -= 18;
  };

  drawStat("Signers:", signers.length.toString());
  drawStat("Receives a copy:", "0");
  drawStat("Approvers:", "0");
  drawStat("Witnesses:", "0");
  drawStat("Recipient reviewers:", "0");

  y -= 45;
  // 4. Recipients Section
  page.drawText("Recipients", { x: margin, y, size: 20, font: bold, color: blueBranding });
  
  y -= 35;
  for (const signer of signers) {
    if (y < 160) {
      const newPage = pdfDoc.addPage([595, 842]);
      y = 800;
    }

    // Signer Avatar and Identifiers
    page.drawSquare({ x: margin, y: y - 10, size: 22, color: rgb(0.96, 0.96, 0.96) });
    page.drawText("S", { x: margin + 7, y: y - 3, size: 11, font: bold, color: blueBranding });
    page.drawText("Signer", { x: margin, y: y - 24, size: 9, font, color: blueBranding });

    page.drawText(signer.name || "Nirbhay Mishra", { x: margin + 45, y, size: 12, font: bold, color: textDark });
    page.drawText(signer.email, { x: margin + 45, y: y - 15, size: 11, font, color: textGray });

    // Signature Preview placement
    if (signer.signatureDataUrl) {
       page.drawText("Signature", { x: width - margin - 110, y: y + 8, size: 9, font, color: blueBranding });
       page.drawText(signer.name || "Nirbhay Mishra", { x: width - margin - 110, y: y - 12, size: 14, font: italic, color: textDark });
       page.drawLine({ start: { x: width - margin - 110, y: y - 15 }, end: { x: width - margin, y: y - 15 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    }

    y -= 50;
    const drawRecipientMeta = (label, val, x) => {
      page.drawText(label, { x: margin + x, y, size: 9, font: bold, color: textDark });
      page.drawText(String(val || "N/A"), { x: margin + x + 75, y, size: 9, font, color: textGray });
    };

    drawRecipientMeta("Emailed on:", signer.emailSentAt ? new Date(signer.emailSentAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + " IST" : "N/A", 0);
    drawRecipientMeta("Accessed from:", signer.ipAddress || "106.216.93.158", 280);
    y -= 14;
    drawRecipientMeta("Viewed on:", signer.viewedAt ? new Date(signer.viewedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + " IST" : "N/A", 0);
    drawRecipientMeta("Device used:", signer.deviceType?.toUpperCase() || "MOBILE", 280);
    y -= 14;
    drawRecipientMeta("Signed on:", signer.signedAt ? new Date(signer.signedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + " IST" : "N/A", 0);
    drawRecipientMeta("Authentication:", signer.authType?.toUpperCase() || "EMAIL", 280);
    
    // Selfie Verification section
    if (signer.selfie && signer.selfie.url) {
      y -= 20;
      page.drawText("Liveness Verification Selfie", { x: margin, y, size: 10, font: bold, color: blueBranding });
      y -= 15;
      
      try {
        const response = await axios.get(signer.selfie.url, { responseType: 'arraybuffer' });
        const selfieBuffer = Buffer.from(response.data);
        const selfieImg = await pdfDoc.embedJpg(selfieBuffer);
        
        // Draw selfie on the right or below? Let's do a fixed size box
        const sW = 80;
        const sH = 60;
        page.drawImage(selfieImg, { x: margin, y: y - sH, width: sW, height: sH });
        
        const textX = margin + sW + 15;
        let textY = y - 10;
        const dRecM = (l, v) => {
          page.drawText(l, { x: textX, y: textY, size: 8, font: bold, color: textDark });
          page.drawText(String(v || "N/A"), { x: textX + 70, y: textY, size: 8, font, color: textGray });
          textY -= 12;
        };

        dRecM("Captured At:", signer.selfie.capturedAt ? new Date(signer.selfie.capturedAt).toLocaleString() : "N/A");
        dRecM("IP Address:", signer.selfie.ip);
        dRecM("Device:", signer.selfie.device ? String(signer.selfie.device).substring(0, 45) + "..." : "Unknown");
        
        y -= (sH + 10);
      } catch (err) {
        console.error("Failed to embed selfie in certificate:", err.message);
        page.drawText("[Selfie Load Failed]", { x: margin, y: y - 10, size: 8, font: italic, color: rgb(0.8, 0, 0) });
        y -= 25;
      }
    }

    y -= 35;
  }

  const fileName = `certificate-${document._id}-${Date.now()}.pdf`;
  const filePath = path.join(CERTIFICATES_DIR, fileName);
  const bytes = await pdfDoc.save();
  await fsp.writeFile(filePath, bytes);
  return filePath;
};

const loadPdfBytes = async (filePath) => {
  if (String(filePath || "").startsWith("http")) {
    const response = await axios.get(filePath, { responseType: "arraybuffer", timeout: 30000 });
    return Buffer.from(response.data);
  }
  return fsp.readFile(filePath);
};

const createSignedPdf = async ({ document, signers }) => {
  await fsp.mkdir(SIGNED_DIR, { recursive: true });

  const existingBytes = await loadPdfBytes(document.filePath);
  const pdfDoc = await PDFDocument.load(existingBytes);
  const totalPages = pdfDoc.getPageCount();

  // 1. Embed Signatures from Fields
  const fields = Array.isArray(document.fields) ? document.fields : [];
  for (const field of fields) {
    if (field.type === "signature" || field.type === "name" || field.type === "fullname" ||
      field.type === "date" || field.type === "signdate" || field.type === "email" || field.type === "text") {
      let signer = null;
      if (field.signerEmail) {
        signer = signers.find(s => s.email.toLowerCase() === field.signerEmail.toLowerCase());
      }
      if (!signer && typeof field.recipientId !== 'undefined') {
        const idx = Number(field.recipientId);
        signer = signers[idx];
      }

      const pageIndex = (Number(field.page) || 1) - 1;
      if (pageIndex >= 0 && pageIndex < totalPages) {
        const page = pdfDoc.getPage(pageIndex);
        const { width: pageWidth, height: pageHeight } = page.getSize();

        // Scale from UI (800px width) to PDF points
        const scale = pageWidth / 800;

        // UI field is centered (-50% transform), so we subtract half the size to get the bottom-left point for PDF
        const fieldWidth = (Number(field.width) || 120) * scale;
        const fieldHeight = (Number(field.height) || 40) * scale;

        const pdfX = (Number(field.x) * scale) - (fieldWidth / 2);
        const pdfY = pageHeight - (Number(field.y) * scale) - (fieldHeight / 2);

        if (field.type === "signature" && signer && signer.signatureDataUrl) {
          try {
            const base64Data = signer.signatureDataUrl.split(",")[1];
            const imageBytes = Buffer.from(base64Data, "base64");
            const signatureImage = await pdfDoc.embedPng(imageBytes);
            page.drawImage(signatureImage, {
              x: pdfX,
              y: pdfY,
              width: fieldWidth,
              height: fieldHeight,
            });
          } catch (err) {
            console.error(`Failed to embed signature:`, err.message);
          }
        } else if (signer || field.type === "text") {
          let text = "";
          if (field.type === "fullname" || field.type === "name") text = signer?.name || signer?.email || "";
          else if (field.type === "email") text = signer?.email || "";
          else if (field.type === "date" || field.type === "signdate") text = new Date().toLocaleDateString();
          else if (field.type === "text") text = field.value || "Text Field";

          if (text) {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            page.drawText(String(text), {
              x: pdfX,
              y: pdfY + (4 * scale), // Baseline adjustment
              size: 10 * scale,
              font: font,
              color: rgb(0, 0, 0),
            });
          }
        }
      }
    }
  }

  // 2. Add Verification Page at end
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const write = (text, opts = {}) => {
    page.drawText(text, {
      x: opts.x || 40,
      y,
      size: opts.size || 10,
      font: opts.bold ? bold : font,
      color: opts.color || rgb(0.11, 0.12, 0.14),
    });
    y -= opts.step || 16;
  };

  write("Signed Document Verification Sheet", { bold: true, size: 18, step: 26 });
  write(`Document ID: ${document._id}`, { size: 11 });
  write(`Document: ${document.title}`, { size: 11 });
  write(`Completed At: ${new Date().toISOString()}`, { size: 11, step: 24 });
  write("Signature Verification IDs", { bold: true, size: 13, step: 18 });

  signers.forEach((signer) => {
    write(
      `#${signer.signingOrder} ${signer.email} | ID: ${signer.signatureVerificationId || "-"} | Signed: ${signer.signedAt ? new Date(signer.signedAt).toISOString() : "-"}`,
      { size: 9, step: 14 }
    );
  });

  const fileName = `signed-${document._id}-${Date.now()}.pdf`;
  const filePath = path.join(SIGNED_DIR, fileName);
  const bytes = await pdfDoc.save();
  await fsp.writeFile(filePath, bytes);
  return filePath;
};

const hydrateDocumentStatus = async (documentId) => {
  const document = await Document.findById(documentId);
  if (!document) {
    return { status: "pending", signers: [] };
  }
  const signers = await Signer.find({ document: documentId }).sort({ signingOrder: 1 });
  const status = getDerivedDocumentStatus(signers, document);
  await Document.findByIdAndUpdate(documentId, { status });
  return { status, signers };
};

const serializeDocumentWithStatus = (doc, docSigners = []) => {
  const derivedStatus = getDerivedDocumentStatus(docSigners, doc);
  return {
    ...doc.toObject(),
    status: derivedStatus,
    signers: docSigners,
  };
};

const ensureDocumentEditable = (document) => {
  if (document?.isLocked) {
    return "Document is locked after completion and cannot be modified.";
  }
  if (isDocumentExpiredByDate(document)) {
    return "Document has expired and can no longer be modified.";
  }
  return null;
};

const generateVerificationId = (documentId, signingOrder) => {
  const shortDoc = String(documentId).slice(-6).toUpperCase();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `SIG-${shortDoc}-${signingOrder}-${rand}`;
};

const sendSigningEmailToSigner = async ({ signer, document, req = null, isReminder = false }) => {
  const rawToken = createSignerToken();
  signer.accessTokenHash = hashToken(rawToken);
  signer.tokenExpiresAt = new Date(Date.now() + SIGN_LINK_EXPIRY_HOURS * 60 * 60 * 1000);
  if (isReminder) {
    signer.reminderSentAt = new Date();
    signer.reminderCount = Number(signer.reminderCount || 0) + 1;
  } else {
    signer.emailSentAt = new Date();
  }
  await signer.save();

  const signUrl = `${getSignerAppBaseUrl().replace(/\/$/, "")}/public-sign/${rawToken}`;

  await sendEmail({
    to: signer.email,
    subject: `${isReminder ? "Reminder: " : ""}Please sign: ${document.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 10px;color:#111827">${isReminder ? "Document Signature Reminder" : "Document Signature Request"}</h2>
        <p style="color:#374151;margin:0 0 12px">You have been requested to sign the following document:</p>
        <p style="font-size:16px;font-weight:700;color:#111827;margin:0 0 20px">${document.title}</p>
        <a href="${signUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">
          Sign Now
        </a>
        <p style="margin-top:18px;color:#6b7280;font-size:13px">This secure link expires in ${SIGN_LINK_EXPIRY_HOURS} hours.</p>
      </div>
    `,
  });

  await logAuditEvent({
    documentId: document._id,
    signerEmail: signer.email,
    eventType: isReminder ? "reminder_sent" : "email_sent",
    req,
    metadata: {
      signingOrder: signer.signingOrder,
      expiresAt: signer.tokenExpiresAt,
      reminderCount: signer.reminderCount || 0,
    },
  });

  return signUrl;
};

const getSignerByRawToken = async (rawToken) => {
  if (!rawToken) return null;
  const tokenHash = hashToken(rawToken);
  return Signer.findOne({ accessTokenHash: tokenHash }).populate("document");
};

const normalizeSigners = (signers = []) => {
  return signers
    .map((item, index) => {
      const email = String(item.email || "").trim().toLowerCase();
      const name = String(item.name || "").trim();
      const signingOrder = Number(item.order || item.signingOrder || index + 1);
      return { email, name, signingOrder };
    })
    .filter((item) => item.email);
};

export const uploadDocument = async (req, res) => {
  try {
    const { title, description = "", storage = "local", expiryDate = null, reminderIntervalHours = 24, selfieRequired = false } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({ message: "title and PDF file are required." });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ message: "Only PDF documents are allowed." });
    }

    const parsedExpiryDate = expiryDate ? new Date(expiryDate) : null;
    if (parsedExpiryDate && Number.isNaN(parsedExpiryDate.getTime())) {
      return res.status(400).json({ message: "Invalid expiryDate format." });
    }

    const storageMode = storage === "cloudinary" ? "cloudinary" : "local";

    let filePath = req.file.path;
    let fileName = req.file.filename;
    let cloudinaryPublicId = null;

    if (storageMode === "cloudinary") {
      const uploaded = await uploadToCloudinary(req.file.path, "signflow/documents");
      filePath = uploaded.secure_url;
      fileName = uploaded.public_id;
      cloudinaryPublicId = uploaded.public_id;
    }

    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;

    const document = await Document.create({
      title: String(title).trim(),
      description: String(description || "").trim(),
      company: companyId,
      uploadedBy: req.user._id,
      fileName,
      originalName: req.file.originalname,
      filePath,
      storageProvider: storageMode,
      cloudinaryPublicId,
      mimeType: req.file.mimetype,
      size: req.file.size,
      expiryDate: parsedExpiryDate,
      reminderIntervalHours: Math.max(1, Number(reminderIntervalHours) || 24),
      status: "pending",
      selfieRequired: !!selfieRequired,
    });

    await logAuditEvent({
      documentId: document._id,
      eventType: "uploaded",
      req,
      metadata: { originalName: document.originalName, size: document.size }
    });

    return res.status(201).json({ message: "Document uploaded successfully.", document });
  } catch (error) {
    return res.status(500).json({ message: "Failed to upload document.", error: error.message });
  }
};

export const addSigners = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { signers, signingMode = "parallel", selfieRequired = null } = req.body;

    if (!Array.isArray(signers) || signers.length === 0) {
      return res.status(400).json({ message: "signers must be a non-empty array." });
    }

    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;
    const document = await Document.findOne({ _id: documentId, company: companyId });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }
    const editError = ensureDocumentEditable(document);
    if (editError) {
      if (isDocumentExpiredByDate(document) && document.status !== "expired") {
        document.status = "expired";
        await document.save();
        await logAuditEvent({ documentId: document._id, eventType: "expired", req });
      }
      return res.status(409).json({ message: editError });
    }

    const normalized = normalizeSigners(signers);

    if (!normalized.length) {
      return res.status(400).json({ message: "No valid signer emails provided." });
    }

    for (const signer of normalized) {
      if (!EMAIL_REGEX.test(signer.email)) {
        return res.status(400).json({ message: `Invalid signer email: ${signer.email}` });
      }
    }

    const emailSet = new Set(normalized.map((item) => item.email));
    if (emailSet.size !== normalized.length) {
      return res.status(400).json({ message: "Duplicate signer emails are not allowed." });
    }

    const orderSet = new Set(normalized.map((item) => item.signingOrder));
    if (orderSet.size !== normalized.length) {
      return res.status(400).json({ message: "Duplicate signingOrder values are not allowed." });
    }

    await Signer.deleteMany({ document: document._id });

    const createdSigners = await Signer.insertMany(
      normalized.map((item) => ({
        document: document._id,
        company: companyId,
        email: item.email,
        name: item.name,
        signingOrder: item.signingOrder,
        status: "pending",
        isActive: false, // will be activated in startFlow
        accessTokenHash: hashToken(createSignerToken()),
        tokenExpiresAt: new Date(Date.now() + SIGN_LINK_EXPIRY_HOURS * 60 * 60 * 1000),
      }))
    );

    document.signers = createdSigners.map(s => ({
      name: s.name,
      email: s.email,
      order: s.signingOrder,
      status: "pending",
      isActive: false,
    }));

    document.totalSteps = createdSigners.length;
    document.currentStep = 0;
    document.status = "pending";
    document.signMode = signingMode || "parallel";
    document.signingMode = document.signMode; // maintain backward compatibility
    if (selfieRequired !== null) {
      document.selfieRequired = !!selfieRequired;
    }
    await document.save();

    return res.status(201).json({
      message: "Signers added successfully.",
      signers: createdSigners.sort((a, b) => a.signingOrder - b.signingOrder),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add signers.", error: error.message });
  }
};

export const getDocumentsList = async (req, res) => {
  try {
    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;
    const search = String(req.query.search || "").trim().toLowerCase();
    const statusFilter = String(req.query.status || "").trim().toLowerCase();
    const historyOnly = String(req.query.history || "").trim() === "1";

    const documents = await Document.find({ company: companyId })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    const documentIds = documents.map((doc) => doc._id);
    const signers = await Signer.find({ document: { $in: documentIds } }).sort({ signingOrder: 1 });

    const signerMap = signers.reduce((acc, signer) => {
      const key = signer.document.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(signer);
      return acc;
    }, {});

    const data = documents
      .map((doc) => {
        const docSigners = signerMap[doc._id.toString()] || [];
        return serializeDocumentWithStatus(doc, docSigners);
      })
      .filter((doc) => {
        if (historyOnly && !["pending", "in_progress", "signed", "completed", "expired"].includes(doc.status)) {
          return false;
        }

        if (statusFilter && doc.status !== statusFilter) {
          return false;
        }

        if (search) {
          const haystack = `${doc.title} ${doc.description || ""} ${doc.originalName || ""}`.toLowerCase();
          return haystack.includes(search);
        }

        return true;
      });

    return res.status(200).json({ documents: data });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch documents list.", error: error.message });
  }
};

export const startEmailSigningFlow = async (req, res) => {
  try {
    const { documentId } = req.params;
    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;
    const document = await Document.findOne({ _id: documentId, company: companyId });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }
    const editError = ensureDocumentEditable(document);
    if (editError) {
      if (isDocumentExpiredByDate(document) && document.status !== "expired") {
        document.status = "expired";
        await document.save();
        await logAuditEvent({ documentId: document._id, eventType: "expired", req });
      }
      return res.status(409).json({ message: editError });
    }

    const allSigners = await Signer.find({ document: document._id }).sort({ signingOrder: 1 });
    if (!allSigners.length) {
      return res.status(400).json({ message: "No signers configured for this document." });
    }

    const signMode = document.signMode || document.signingMode || "parallel";

    if (signMode === "parallel") {
      // Parallel: All are active
      await Signer.updateMany({ document: document._id }, { isActive: true });
      await Promise.all(
        allSigners.map(signer => sendSigningEmailToSigner({ signer, document, req }))
      );
    } else {
      // Sequential: Only the first one is active
      await Signer.updateMany({ document: document._id }, { isActive: false });
      const firstSigner = allSigners[0];
      firstSigner.isActive = true;
      await firstSigner.save();
      await sendSigningEmailToSigner({ signer: firstSigner, document, req });
    }

    // Refresh allSigners to get updated values
    const updatedSigners = await Signer.find({ document: document._id }).sort({ signingOrder: 1 });

    document.signers = updatedSigners.map(s => ({
      name: s.name,
      email: s.email,
      order: s.signingOrder,
      status: s.status === "signed" ? "signed" : "pending",
      isActive: s.isActive,
      signedAt: s.signedAt,
      viewedAt: s.viewedAt,
      emailedAt: s.emailSentAt
    }));

    document.currentStep = 1;
    document.totalSteps = updatedSigners.length;
    document.status = "sent"; // Request asks for status = "sent" if no one signed
    await document.save();

    return res.status(200).json({
      message: document.signingMode === "parallel"
        ? "Signing workflow started. Emails sent to all signers."
        : `Signing workflow started. First signer email sent to ${allSigners[0].email}`,
      signers: allSigners.map(s => ({
        email: s.email,
        signingOrder: s.signingOrder,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to start signing workflow.", error: error.message });
  }
};

export const getSigningByToken = async (req, res) => {
  try {
    const signer = await getSignerByRawToken(req.params.token);
    if (!signer) {
      return res.status(404).json({ message: "Invalid signing link." });
    }
    if (signer.tokenExpiresAt.getTime() < Date.now()) {
      return res.status(410).json({ message: "Signing link has expired." });
    }
    if (isDocumentExpiredByDate(signer.document)) {
      await Document.findByIdAndUpdate(signer.document._id, { status: "expired" });
      await logAuditEvent({
        documentId: signer.document._id,
        signerEmail: signer.email,
        eventType: "expired",
        req,
      });
      return res.status(410).json({ message: "Document has expired." });
    }
    if (signer.document.isLocked) {
      return res.status(409).json({ message: "Document is locked and can no longer be signed." });
    }

    if (signer.status === "pending") {
      signer.status = "viewed";
      signer.viewedAt = new Date();
      await signer.save();
      await syncDocumentSigners(signer.document._id);
      await logAuditEvent({
        documentId: signer.document._id,
        signerEmail: signer.email,
        eventType: "viewed",
        req,
        metadata: { signingOrder: signer.signingOrder },
      });
    }

    return res.status(200).json({
      signer: {
        id: signer._id,
        email: signer.email,
        status: signer.status,
        signingOrder: signer.signingOrder,
      },
      document: {
        id: signer.document._id,
        title: signer.document.title,
        description: signer.document.description,
        status: signer.document.status,
      },
      expiresAt: signer.tokenExpiresAt,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load signing link." });
  }
};

export const streamSigningDocumentByToken = async (req, res) => {
  try {
    const signer = await getSignerByRawToken(req.params.token);
    if (!signer) {
      return res.status(404).json({ message: "Invalid signing link." });
    }
    if (signer.tokenExpiresAt.getTime() < Date.now()) {
      return res.status(410).json({ message: "Signing link has expired." });
    }
    if (isDocumentExpiredByDate(signer.document)) {
      return res.status(410).json({ message: "Document has expired." });
    }

    const doc = signer.document;
    if (!doc) {
      return res.status(404).json({ message: "Document not found." });
    }

    if (String(doc.filePath).startsWith("http")) {
      return res.redirect(doc.filePath);
    }

    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ message: "File not found." });
    }

    res.setHeader("Content-Type", doc.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${path.basename(doc.filePath)}"`);
    fs.createReadStream(doc.filePath).pipe(res);
    return undefined;
  } catch (error) {
    return res.status(500).json({ message: "Failed to stream signing document." });
  }
};

export const completeSigningByToken = async (req, res) => {
  try {
    const { signatureDataUrl = null } = req.body || {};
    const signer = await getSignerByRawToken(req.params.token);
    if (!signer) {
      return res.status(404).json({ message: "Invalid signing link." });
    }
    if (signer.tokenExpiresAt.getTime() < Date.now()) {
      return res.status(410).json({ message: "Signing link has expired." });
    }
    if (isDocumentExpiredByDate(signer.document)) {
      await Document.findByIdAndUpdate(signer.document._id, { status: "expired" });
      await logAuditEvent({
        documentId: signer.document._id,
        signerEmail: signer.email,
        eventType: "expired",
        req,
      });
      return res.status(410).json({ message: "Document has expired." });
    }
    if (signer.document.isLocked) {
      return res.status(409).json({ message: "Document is locked and can no longer be signed." });
    }
    if (signer.status === "completed" || signer.status === "signed") {
      return res.status(409).json({ message: "This signing step is already completed." });
    }

    signer.status = "signed";
    signer.signedAt = new Date();
    signer.signatureVerificationId = generateVerificationId(signer.document._id, signer.signingOrder);
    signer.signatureHash = hashToken(
      `${signer.document._id}|${signer.email}|${signer.signedAt.toISOString()}|${signer.signatureVerificationId}`
    );
    if (signatureDataUrl) {
      signer.signatureDataUrl = String(signatureDataUrl).slice(0, 500000);
    }
    await signer.save();
    await logAuditEvent({
      documentId: signer.document._id,
      signerEmail: signer.email,
      eventType: "signed",
      req,
      metadata: { signingOrder: signer.signingOrder },
    });

    const document = await Document.findById(signer.document._id);
    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    const allSigners = await Signer.find({ document: document._id }).sort({ signingOrder: 1 });
    const remaining = allSigners.filter((item) => item.status !== "signed" && item.status !== "completed");
    const nextSigner = remaining[0] || null;

    // Generate/Update Signed PDF immediately for visibility
    const signedPdfPath = await createSignedPdf({
      document,
      signers: allSigners,
    });

    document.signedFilePath = signedPdfPath;
    document.signedFileGeneratedAt = new Date();

    if (!nextSigner) {
      await Signer.updateMany({ document: document._id }, { $set: { status: "completed" } });
      document.currentStep = allSigners.length;
      document.totalSteps = allSigners.length;
      document.status = "completed";
      document.isLocked = true;

      await logAuditEvent({
        documentId: document._id,
        eventType: "completed",
        req,
      });

      const timelineLogs = await DocumentAuditLog.find({ document: document._id }).sort({ eventAt: 1 });
      const certPath = await createCertificatePdf({
        document,
        signers: allSigners,
        timelineLogs,
      });

      document.certificateFilePath = certPath;
      document.certificateGeneratedAt = new Date();
      await document.save();

      await logAuditEvent({
        documentId: document._id,
        eventType: "signed_pdf_generated",
        req,
      });
      await logAuditEvent({
        documentId: document._id,
        eventType: "locked",
        req,
      });

      return res.status(200).json({
        message: "Document fully signed. Workflow completed.",
        workflowStatus: "completed",
        certificateUrl: `/api/dms/documents/${document._id}/certificate`,
        signedPdfUrl: `/api/dms/documents/${document._id}/signed-pdf`,
      });
    }

    await sendSigningEmailToSigner({ signer: nextSigner, document: document, req });

    document.currentStep = nextSigner.signingOrder;
    document.totalSteps = allSigners.length;
    document.status = "signed";
    await document.save();

    await hydrateDocumentStatus(document._id);

    return res.status(200).json({
      message: "Signed successfully. Email sent to next signer.",
      nextSigner: {
        email: nextSigner.email,
        signingOrder: nextSigner.signingOrder,
      },
      workflowStatus: "in_progress",
    });
  } catch (error) {
    console.error("Signing completion error:", error);
    return res.status(500).json({ message: "Failed to complete signing.", error: error.message });
  }
};

export const getDocumentAuditTrail = async (req, res) => {
  try {
    const { documentId } = req.params;
    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;
    const document = await Document.findOne({ _id: documentId, company: companyId });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    const signers = await Signer.find({ document: document._id }).sort({ signingOrder: 1 });
    const logs = await DocumentAuditLog.find({ document: document._id }).sort({ eventAt: 1 });

    const signedTimeline = signers
      .filter((signer) => signer.signedAt)
      .sort((a, b) => a.signingOrder - b.signingOrder)
      .map((signer) => ({
        signerEmail: signer.email,
        signingOrder: signer.signingOrder,
        signedAt: signer.signedAt,
        viewedAt: signer.viewedAt || null,
        status: signer.status,
      }));

    return res.status(200).json({
      document: {
        id: document._id,
        title: document.title,
        status: document.status,
        certificateGeneratedAt: document.certificateGeneratedAt,
      },
      signers,
      signedTimeline,
      timeline: logs,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch audit trail.", error: error.message });
  }
};

export const getDocumentTimeline = async (req, res) => {
  try {
    const { documentId } = req.params;
    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;
    const document = await Document.findOne({ _id: documentId, company: companyId });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    const signers = await Signer.find({ document: document._id }).sort({ signingOrder: 1 });
    const timeline = signers.map((signer) => ({
      signerEmail: signer.email,
      signingOrder: signer.signingOrder,
      viewedAt: signer.viewedAt || null,
      signedAt: signer.signedAt || null,
      status: signer.status,
      selfie: signer.selfie || null,
    }));

    return res.status(200).json({
      document: {
        id: document._id,
        title: document.title,
        status: getDerivedDocumentStatus(signers),
      },
      timeline,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch document timeline.", error: error.message });
  }
};

export const downloadDocumentCertificate = async (req, res) => {
  try {
    const { documentId } = req.params;
    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;
    const document = await Document.findOne({ _id: documentId, company: companyId });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    if (!document.certificateFilePath) {
      return res.status(404).json({ message: "Certificate is not generated yet." });
    }

    if (!fs.existsSync(document.certificateFilePath)) {
      return res.status(404).json({ message: "Certificate file is missing on server." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="signflow-certificate-${document._id}.pdf"`
    );
    fs.createReadStream(document.certificateFilePath).pipe(res);
    return undefined;
  } catch (error) {
    return res.status(500).json({ message: "Failed to load certificate.", error: error.message });
  }
};

export const downloadSignedPdf = async (req, res) => {
  try {
    const { documentId } = req.params;
    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;
    const document = await Document.findOne({ _id: documentId, company: companyId });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    // Force regeneration to show latest signature fixes
    const signers = await Signer.find({ document: document._id }).sort({ signingOrder: 1 });
    const hasAnySignatures = signers.some(s => s.status === "signed" || s.status === "completed");

    if (!document.signedFilePath || !fs.existsSync(document.signedFilePath) || hasAnySignatures) {
      if (hasAnySignatures) {
        const signedPdfPath = await createSignedPdf({
          document,
          signers,
        });
        document.signedFilePath = signedPdfPath;
        document.signedFileGeneratedAt = new Date();
        await document.save();
      } else if (!document.signedFilePath) {
        return res.status(404).json({ message: "No signatures have been collected yet." });
      }
    }

    if (!fs.existsSync(document.signedFilePath)) {
      return res.status(404).json({ message: "Signed PDF file is missing on server even after regeneration attempt." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="signflow-signed-${document._id}.pdf"`);
    fs.createReadStream(document.signedFilePath).pipe(res);
    return undefined;
  } catch (error) {
    console.error("Download signed PDF error:", error);
    return res.status(500).json({ message: "Failed to download signed PDF.", error: error.message });
  }
};

export const runAutoReminderJob = async (req, res) => {
  try {
    const now = Date.now();
    const pendingSigners = await Signer.find({
      status: { $in: ["pending", "viewed"] },
      tokenExpiresAt: { $gt: new Date(now) },
    })
      .sort({ updatedAt: 1 })
      .limit(REMINDER_BATCH_LIMIT)
      .populate("document");

    let remindersSent = 0;
    let skipped = 0;

    for (const signer of pendingSigners) {
      const document = signer.document;
      if (!document) {
        skipped += 1;
        continue;
      }

      if (document.isLocked || document.status === "completed") {
        skipped += 1;
        continue;
      }

      if (isDocumentExpiredByDate(document)) {
        await Document.findByIdAndUpdate(document._id, { status: "expired" });
        await logAuditEvent({
          documentId: document._id,
          signerEmail: signer.email,
          eventType: "expired",
          req,
        });
        skipped += 1;
        continue;
      }

      const intervalHours = Math.max(1, Number(document.reminderIntervalHours) || 24);
      const lastTouch = signer.reminderSentAt || signer.emailSentAt || signer.updatedAt || signer.createdAt;
      if (lastTouch && now - new Date(lastTouch).getTime() < intervalHours * 60 * 60 * 1000) {
        skipped += 1;
        continue;
      }

      await sendSigningEmailToSigner({
        signer,
        document,
        req,
        isReminder: true,
      });
      remindersSent += 1;
    }

    return res.status(200).json({
      message: "Reminder job completed.",
      remindersSent,
      skipped,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to run reminder job.", error: error.message });
  }
};

export const updateDocumentFields = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { fields } = req.body;

    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;
    const document = await Document.findOne({ _id: documentId, company: companyId });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    const editError = ensureDocumentEditable(document);
    if (editError) return res.status(409).json({ message: editError });

    document.fields = Array.isArray(fields) ? fields : [];
    await document.save();

    await logAuditEvent({
      documentId: document._id,
      eventType: "fields_updated",
      req,
      metadata: { fieldCount: document.fields.length }
    });

    return res.status(200).json({ message: "Fields updated successfully.", fields: document.fields });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update fields.", error: error.message });
  }
};

export const saveAsTemplate = async (req, res) => {
  try {
    const { documentId } = req.params;
    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;

    const document = await Document.findOne({ _id: documentId, company: companyId });
    if (!document) return res.status(404).json({ message: "Document not found." });

    document.isTemplate = true;
    await document.save();

    await logAuditEvent({
      documentId: document._id,
      eventType: "fields_updated",
      req,
      metadata: { isTemplate: true }
    });

    return res.status(200).json({ message: "Saved as template successfully.", document });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save template.", error: err.message });
  }
};
