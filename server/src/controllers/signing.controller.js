import { SigningService } from "../services/signing.service.js";
import { Signer } from "../models/signer.model.js";
import crypto from "crypto";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const sendOTP = async (req, res) => {
  try {
    const { token, email } = req.body;
    if (!token || !email) {
      return res.status(400).json({ message: "Token and email are required." });
    }

    // Resolve document from token
    const tokenHash = hashToken(token);
    const signer = await Signer.findOne({ accessTokenHash: tokenHash, email: email.toLowerCase() });
    if (!signer) {
      return res.status(404).json({ message: "Signer not found for this token." });
    }

    const result = await SigningService.sendOTP({
      documentId: signer.document,
      signerEmail: email,
      ipAddress: req.ip
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { token, email, otpCode } = req.body;
    if (!token || !email || !otpCode) {
      return res.status(400).json({ message: "Token, email and OTP are required." });
    }

    const tokenHash = hashToken(token);
    const signer = await Signer.findOne({ accessTokenHash: tokenHash, email: email.toLowerCase() });
    if (!signer) {
      return res.status(404).json({ message: "Signer record not found." });
    }

    const result = await SigningService.verifyOTP({
      documentId: signer.document,
      signerEmail: email,
      otpCode,
      ipAddress: req.ip
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const signDocument = async (req, res) => {
  try {
    const { token, email, signatureData } = req.body;
    if (!token || !email || !signatureData) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const tokenHash = hashToken(token);
    const signer = await Signer.findOne({ accessTokenHash: tokenHash, email: email.toLowerCase() });
    if (!signer) {
      return res.status(404).json({ message: "Signer record not found." });
    }

    const result = await SigningService.signDocument({
      documentId: signer.document,
      signerEmail: email,
      signatureData,
      ipAddress: req.ip
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getDocumentByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const tokenHash = hashToken(token);
    const signer = await Signer.findOne({ accessTokenHash: tokenHash }).populate("document");

    if (!signer) {
      return res.status(404).json({ message: "Invalid or expired link." });
    }

    // Return if highly verified or if OTP is needed
    return res.status(200).json({
      document: {
        id: signer.document._id,
        title: signer.document.title,
        description: signer.document.description,
        status: signer.document.status,
        signingMode: signer.document.signingMode,
        fields: signer.document.fields,
        selfieRequired: signer.document.selfieRequired
      },
      signer: {
        email: signer.email,
        name: signer.name,
        isVerified: signer.isVerified,
        status: signer.status,
        signingOrder: signer.signingOrder,
        selfie: signer.selfie
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load document." });
  }
};

export const streamDocumentPreview = async (req, res) => {
  try {
    const { token } = req.params;
    const tokenHash = hashToken(token);
    const signer = await Signer.findOne({ accessTokenHash: tokenHash }).populate("document");

    if (!signer) {
      return res.status(404).json({ message: "Invalid token." });
    }

    const doc = signer.document;
    if (doc.storageProvider === "cloudinary" || String(doc.filePath).startsWith("http")) {
      return res.redirect(doc.filePath);
    }

    // Logic for local file streaming
    const absolutePath = doc.filePath;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    return res.sendFile(absolutePath);
  } catch (error) {
    return res.status(500).json({ message: "Failed to stream document." });
  }
};

export const uploadSelfie = async (req, res) => {
  try {
    const { token, email, selfieImage, device } = req.body;
    if (!token || !email || !selfieImage) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const tokenHash = hashToken(token);
    const signer = await Signer.findOne({ accessTokenHash: tokenHash, email: email.toLowerCase() });
    if (!signer) {
      return res.status(404).json({ message: "Signer record not found." });
    }

    const result = await SigningService.saveSelfie({
      documentId: signer.document,
      signerEmail: email,
      selfieImage,
      ipAddress: req.ip,
      device: device || req.headers["user-agent"]
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
