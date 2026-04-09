import mongoose from "mongoose";

const documentAuditLogSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    signerEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        "uploaded",
        "fields_updated",
        "email_sent",
        "reminder_sent",
        "viewed",
        "signed",
        "completed",
        "expired",
        "signed_pdf_generated",
        "locked",
        "selfie_captured",
      ],
      required: true,
      index: true,
    },
    eventAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "bot", "unknown"],
      default: "unknown",
    },
    userAgent: {
      type: String,
      default: "",
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export const DocumentAuditLog = mongoose.model("DocumentAuditLog", documentAuditLogSchema);
