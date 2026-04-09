import { Signer } from "../models/signer.model.js";
import { Document } from "../models/document.model.js";
import { AuditLog } from "../models/auditLog.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import { cloudinary } from "../config/cloudinary.js";
import bcrypt from "bcryptjs";

export class SigningService {
  /**
   * Generate 6-digit OTP and send to signer email
   */
  static async sendOTP({ documentId, signerEmail, ipAddress }) {
    const signer = await Signer.findOne({ document: documentId, email: signerEmail.toLowerCase() });
    if (!signer) throw new Error("Recipient not found for this document.");

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Save hashed OTP and expiry (10 minutes)
    signer.otpCode = hashedOtp;
    signer.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    signer.otpAttempts = 0; // Reset attempts
    await signer.save();

    // Send email
    await sendEmail({
      to: signer.email,
      subject: `Your Verification Code for Document Signing`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #249272; margin-bottom: 20px;">Identity Verification</h2>
          <p>You have requested to review or sign a document. Please use the following 6-digit verification code to proceed:</p>
          <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; margin: 20px 0; border: 1px dashed #cbd5e1;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #edf2f7; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">Securely powered by Gitakshmi Sign</p>
        </div>
      `
    });

    return { success: true, message: "OTP sent successfully." };
  }

  /**
   * Verify the 6-digit OTP
   */
  static async verifyOTP({ documentId, signerEmail, otpCode, ipAddress }) {
    const signer = await Signer.findOne({ document: documentId, email: signerEmail.toLowerCase() });
    if (!signer) throw new Error("Recipient not found.");

    // Check expiry
    if (!signer.otpExpiresAt || signer.otpExpiresAt < new Date()) {
      throw new Error("OTP has expired. Please request a new one.");
    }

    // Limit attempts
    if (signer.otpAttempts >= 5) {
      throw new Error("Too many failed attempts. Please request a new code.");
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otpCode, signer.otpCode);
    if (!isValid) {
      signer.otpAttempts += 1;
      await signer.save();

      // Log failure
      await AuditLog.create({
        document: documentId,
        signer: signer._id,
        action: "OTP_FAILED",
        ipAddress,
        metadata: { email: signerEmail, attempts: signer.otpAttempts }
      });

      throw new Error("Invalid verification code.");
    }

    // Success
    signer.isVerified = true;
    signer.verifiedAt = new Date();
    signer.otpCode = null; // Clear OTP
    signer.otpAttempts = 0;
    await signer.save();

    // Log success
    await AuditLog.create({
      document: documentId,
      signer: signer._id,
      action: "OTP_VERIFIED",
      ipAddress
    });

    return { success: true, message: "Identity verified." };
  }

  /**
   * Process document signing
   */
  static async signDocument({ documentId, signerEmail, signatureData, ipAddress }) {
    const document = await Document.findById(documentId);
    if (!document) throw new Error("Document not found.");

    const signer = await Signer.findOne({ document: documentId, email: signerEmail.toLowerCase() });
    if (!signer) throw new Error("Recipient not found.");

    // 1. Mandatory OTP Check
    if (!signer.isVerified) {
      throw new Error("OTP verification required before signing.");
    }

    // 2. Sequential/Active Validation
    if (!signer.isActive) {
      throw new Error("It is not your turn to sign this document.");
    }

    // 3. Selfie Check
    if (document.selfieRequired && (!signer.selfie || !signer.selfie.url)) {
      throw new Error("Selfie verification required before finishing.");
    }

    // 4. Update Signer Status
    signer.status = "signed";
    signer.signedAt = new Date();
    signer.signatureDataUrl = signatureData;
    signer.isActive = false; // completed signing
    await signer.save();

    // 4. Update Document Workflow
    document.currentStep += 1;

    // Check if fully completed
    const allSigners = await Signer.find({ document: documentId }).sort({ signingOrder: 1 });
    const allSigned = allSigners.every(s => s.status === "signed" || s.status === "completed");

    const signMode = document.signMode || document.signingMode || "parallel";

    if (allSigned) {
      document.status = "completed";
    } else {
      document.status = "pending"; // Per requirement: "IF some signed: status = 'pending'"

      // Activate and Notify NEXT signer in sequential mode
      if (signMode === "sequential") {
        const nextSigner = allSigners.find(s => s.signingOrder > signer.signingOrder && s.status !== "signed");
        if (nextSigner) {
          nextSigner.isActive = true;
          await nextSigner.save();
          await this.notifyRecipient(document, nextSigner);
        }
      }
    }

    // Sync document.signers for frontend/audit
    document.signers = allSigners.map(s => ({
      name: s.name,
      email: s.email,
      order: s.signingOrder,
      status: s.status === "signed" ? "signed" : "pending",
      isActive: s.isActive,
      signedAt: s.signedAt,
      viewedAt: s.viewedAt,
      emailedAt: s.emailSentAt || s.createdAt,
      selfie: s.selfie
    }));

    await document.save();

    // 5. Log Audit
    await AuditLog.create({
      document: documentId,
      signer: signer._id,
      action: "DOCUMENT_SIGNED",
      ipAddress
    });

    // 6. Notify Completion if done
    if (document.status === "completed") {
      await this.notifyCompletion(document, allSigners);
    }

    return { success: true, status: document.status };
  }

  /**
   * Helper to notify next recipient
   */
  static async notifyRecipient(document, signer) {
    await sendEmail({
      to: signer.email,
      subject: `Signature Requested: ${document.title}`,
      html: `
          <h3>A document is ready for your signature</h3>
          <p>Please click the link below to review and sign <strong>${document.title}</strong>.</p>
          <a href="${process.env.FRONTEND_URL}/review/${document._id}" style="padding: 10px 20px; background: #249272; color: white; text-decoration: none; border-radius: 4px;">Review & Sign</a>
        `
    });
  }

  /**
   * Notify all parties on completion
   */
  static async notifyCompletion(document, signers) {
    const partyEmails = signers.map(s => s.email);
    // Also notify the owner/HR
    const owner = await Document.findById(document._id).populate("uploadedBy");
    if (owner && owner.uploadedBy) partyEmails.push(owner.uploadedBy.email);

    await sendEmail({
      to: partyEmails,
      subject: `Completed: ${document.title}`,
      html: `
          <h3>Document Signed and Completed</h3>
          <p>The document <strong>${document.title}</strong> has been signed by all parties.</p>
        `
    });
  }

  /**
   * Save and upload selfie
   */
  static async saveSelfie({ documentId, signerEmail, selfieImage, ipAddress, device }) {
    const document = await Document.findById(documentId);
    if (!document) throw new Error("Document not found.");

    const signer = await Signer.findOne({ document: documentId, email: signerEmail.toLowerCase() });
    if (!signer) throw new Error("Recipient not found.");

    if (signer.status === "signed" || signer.status === "completed") {
       throw new Error("Already completed signing.");
    }

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(selfieImage, {
      folder: "gitakshmi-sign/selfies",
      resource_type: "image"
    });

    signer.selfie = {
      url: uploadResponse.secure_url,
      capturedAt: new Date(),
      ip: ipAddress,
      device: device || "Unknown"
    };

    await signer.save();

    // Log Audit
    await AuditLog.create({
      document: documentId,
      signer: signer._id,
      action: "SELFIE_CAPTURED",
      ipAddress,
      metadata: { url: uploadResponse.secure_url, device }
    });

    return { success: true, selfieUrl: uploadResponse.secure_url };
  }
}
