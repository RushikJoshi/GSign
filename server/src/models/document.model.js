import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    storageProvider: {
      type: String,
      enum: ["local", "cloudinary"],
      default: "local",
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    mimeType: {
      type: String,
      default: "application/pdf",
    },
    size: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: Date,
      default: null,
      index: true,
    },
    reminderIntervalHours: {
      type: Number,
      default: 24,
    },
    status: {
      type: String,
      enum: ["draft", "in_progress", "pending", "signed", "completed", "expired", "sent", "viewed", "Viewed"],
      default: "pending",
      index: true,
    },
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      default: null,
    },
    currentStep: {
      type: Number,
      default: 0,
    },
    totalSteps: {
      type: Number,
      default: 0,
    },
    certificateFilePath: {
      type: String,
      default: null,
    },
    certificateGeneratedAt: {
      type: Date,
      default: null,
    },
    signedFilePath: {
      type: String,
      default: null,
    },
    signedFileGeneratedAt: {
      type: Date,
      default: null,
    },
    isLocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    fields: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    selfieRequired: {
      type: Boolean,
      default: false,
    },
    // NEW FIELDS FOR SIGNING WORKFLOW
    signMode: {
      type: String,
      enum: ["sequential", "parallel"],
      default: "sequential",
    },
    signingMode: {
       type: String,
       enum: ["sequential", "parallel"],
       default: "sequential",
    },
    signers: [
      {
        name: String,
        email: String,
        order: Number,
        status: {
          type: String,
          enum: ["pending", "signed"],
          default: "pending",
        },
        isActive: {
          type: Boolean,
          default: false,
        },
        signedAt: Date,
        viewedAt: Date,
        emailedAt: Date,
        selfie: {
          url: String,
          capturedAt: Date,
          ip: String,
          device: String,
        },
      },
    ],
  },
  { timestamps: true }
);

export const Document = mongoose.model("Document", documentSchema);
