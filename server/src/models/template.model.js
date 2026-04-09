import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    createdBy: {
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
    mimeType: {
      type: String,
      default: "application/pdf",
    },
    size: {
      type: Number,
      required: true,
    },
    fields: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    roles: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    selfieRequired: {
      type: Boolean,
      default: false,
    },
    signFormCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    ownerName: {
      type: String,
      default: "Me",
    }
  },
  { timestamps: true }
);

export const Template = mongoose.model("Template", templateSchema);
