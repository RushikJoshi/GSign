import express from "express";
import multer from "multer";
import { authMiddleware as authenticate } from "../middlewares/authMiddleware.js";
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplateFields,
  deleteTemplate,
  duplicateTemplate,
  toggleSignForm,
  getTemplateFile,
} from "../controllers/template.controller.js";

const router = express.Router();

// Multer storage for local storage mode if not using Cloudinary directly
const upload = multer({ dest: "uploads/documents/" });

router.use(authenticate);

router.post("/", upload.single("file"), createTemplate);
router.get("/", getTemplates);
router.get("/:id", getTemplateById);
router.patch("/:id/fields", updateTemplateFields);
router.delete("/:id", deleteTemplate);
router.post("/:id/duplicate", duplicateTemplate);
router.patch("/:id/toggle-signform", toggleSignForm);
router.get("/:id/file", getTemplateFile);

export default router;
