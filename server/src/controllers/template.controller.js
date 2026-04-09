import { Template } from "../models/template.model.js";
import { uploadToCloudinary } from "../utils/cloudinaryUtils.js";
import fs from "fs";
import path from "path";

export const createTemplate = async (req, res) => {
  try {
    const { name, description = "", roles = "[]" } = req.body;
    
    if (!name || !req.file) {
      return res.status(400).json({ message: "Name and PDF file are required." });
    }

    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;

    const template = await Template.create({
      name: String(name).trim(),
      description: String(description).trim(),
      company: companyId,
      createdBy: req.user._id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      roles: JSON.parse(roles),
    });

    return res.status(201).json({ message: "Template created successfully.", template });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create template.", error: error.message });
  }
};

export const updateTemplateFields = async (req, res) => {
  try {
    const { id } = req.params;
    const { fields } = req.body;
    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;

    const template = await Template.findOneAndUpdate(
      { _id: id, company: companyId },
      { fields },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ message: "Template not found." });
    }

    return res.status(200).json({ message: "Template updated successfully.", template });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update template.", error: error.message });
  }
};

export const getTemplates = async (req, res) => {
  try {
    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;
    const search = String(req.query.search || "").trim().toLowerCase();

    const query = { company: companyId };
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const templates = await Template.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ templates });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch templates.", error: error.message });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;

    const template = await Template.findOne({ _id: id, company: companyId });
    if (!template) {
      return res.status(404).json({ message: "Template not found." });
    }

    return res.status(200).json({ template });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch template.", error: error.message });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;

    const template = await Template.findOneAndDelete({ _id: id, company: companyId });
    if (!template) {
      return res.status(404).json({ message: "Template not found." });
    }

    return res.status(200).json({ message: "Template deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete template.", error: error.message });
  }
};

export const duplicateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;

    const original = await Template.findOne({ _id: id, company: companyId });
    if (!original) return res.status(404).json({ message: "Template not found." });

    const copy = await Template.create({
      ...original.toObject(),
      _id: undefined,
      name: `${original.name} (Copy)`,
      createdBy: req.user._id,
      createdAt: undefined,
      updatedAt: undefined,
      isPublic: false,
      signFormCode: undefined,
    });

    return res.status(201).json({ message: "Template duplicated.", template: copy });
  } catch (error) {
    return res.status(500).json({ message: "Failed to duplicate template.", error: error.message });
  }
};

export const toggleSignForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;

    const update = { isPublic };
    if (isPublic) {
      update.signFormCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    } else {
      update.$unset = { signFormCode: 1 };
    }

    const template = await Template.findOneAndUpdate(
      { _id: id, company: companyId },
      update,
      { new: true }
    );

    return res.status(200).json({ message: `SignForm ${isPublic ? 'enabled' : 'disabled'}.`, template });
  } catch (error) {
    return res.status(500).json({ message: "Failed to toggle SignForm.", error: error.message });
  }
};

export const getTemplateFile = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company?._id || req.user.companyId?._id || req.user.companyId;

    const template = await Template.findOne({ _id: id, company: companyId });
    if (!template) return res.status(404).json({ message: "Template not found." });

    if (!fs.existsSync(template.filePath)) {
      return res.status(404).json({ message: "Template file is missing on server." });
    }

    res.setHeader("Content-Type", template.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${template.originalName}"`);
    fs.createReadStream(template.filePath).pipe(res);
    return undefined;
  } catch (error) {
    return res.status(500).json({ message: "Failed to download template.", error: error.message });
  }
};
