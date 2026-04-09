import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    signer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Signer",
      default: null,
    },
    actorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "DOCUMENT_UPLOADED",
        "SIGN_REQUEST_SENT",
        "DOCUMENT_VIEWED",
        "DOCUMENT_SIGNED",
        "OTP_VERIFIED",
        "OTP_FAILED",
        "DOCUMENT_DECLINED",
        "SELFIE_CAPTURED",
      ],
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
