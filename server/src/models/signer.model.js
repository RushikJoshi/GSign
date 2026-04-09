import mongoose from "mongoose";

const signerSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    signingOrder: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["pending", "viewed", "signed", "completed"],
      default: "pending",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    accessTokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tokenExpiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
    reminderCount: {
      type: Number,
      default: 0,
    },
    viewedAt: {
      type: Date,
      default: null,
    },
    signedAt: {
      type: Date,
      default: null,
    },
    signatureVerificationId: {
      type: String,
      default: null,
      index: true,
    },
    signatureHash: {
      type: String,
      default: null,
    },
    signatureDataUrl: {
      type: String,
      default: null,
    },
    // NEW FIELDS FOR OTP AND WORKFLOW
    name: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["signer", "approver", "cc"],
      default: "signer",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otpCode: {
      type: String,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    selfie: {
      url: String,
      capturedAt: Date,
      ip: String,
      device: String,
    }
  },
  { timestamps: true }
);

signerSchema.index({ document: 1, email: 1 }, { unique: true });
signerSchema.index({ document: 1, signingOrder: 1 }, { unique: true });

export const Signer = mongoose.model("Signer", signerSchema);
