import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLE_OPTIONS, ROLES } from "../constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ROLE_OPTIONS,
      default: ROLES.EMPLOYEE,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },
    // Compatibility path for existing modules while standardizing on companyId
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    firstName: {
      type: String,
      trim: true,
      default: "",
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
    },
    jobTitle: {
      type: String,
      trim: true,
      default: "",
    },
    signatureUrl: {
      type: String,
      default: null,
    },
    initialsUrl: {
      type: String,
      default: null,
    },
    stampUrl: {
      type: String,
      default: null,
    },
    dateFormat: {
      type: String,
      default: "MMM dd yyyy HH:mm z",
    },
    timeZone: {
      type: String,
      default: "Asia/Kolkata",
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre("validate", function syncCompanyFields() {
  if (this.companyId && !this.company) {
    this.company = this.companyId;
  }
  if (this.company && !this.companyId) {
    this.companyId = this.company;
  }

  if (this.role === ROLES.SUPERADMIN) {
    this.companyId = null;
    this.company = null;
  }

  if (this.role !== ROLES.SUPERADMIN && !this.companyId) {
    throw new Error("companyId is required for non-superadmin users.");
  }
});

userSchema.pre("save", async function preSave() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(rawPassword) {
  return bcrypt.compare(rawPassword, this.password);
};

export const User = mongoose.model("User", userSchema);
