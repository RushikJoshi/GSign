import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import {
  addSigners,
  completeSigningByToken,
  downloadDocumentCertificate,
  downloadSignedPdf,
  getDocumentAuditTrail,
  getDocumentsList,
  getDocumentTimeline,
  getSigningByToken,
  runAutoReminderJob,
  startEmailSigningFlow,
  streamSigningDocumentByToken,
  uploadDocument,
  updateDocumentFields,
} from "../controllers/documentManagement.controller.js";
import { ROLES } from "../constants/roles.js";
import { authorizeRoles, protect, requireCompanyContext } from "../middlewares/auth.middleware.js";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads", "documents");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
    cb(null, `${Date.now()}-${safeBase || "document"}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed."));
      return;
    }
    cb(null, true);
  },
});

router.get("/sign/:token", getSigningByToken);
router.get("/sign/:token/file", streamSigningDocumentByToken);
router.post("/sign/:token/complete", completeSigningByToken);

router.use(protect, requireCompanyContext, authorizeRoles(ROLES.ADMIN, ROLES.HR));

router.post("/documents/upload", upload.single("document"), uploadDocument);
router.patch("/documents/:documentId/fields", updateDocumentFields);
router.post("/documents/:documentId/signers", addSigners);
router.post("/documents/:documentId/start-signing", startEmailSigningFlow);
router.post("/reminders/run", runAutoReminderJob);
router.get("/documents/:documentId/audit-trail", getDocumentAuditTrail);
router.get("/documents/:documentId/timeline", getDocumentTimeline);
router.get("/documents/:documentId/certificate", downloadDocumentCertificate);
router.get("/documents/:documentId/signed-pdf", downloadSignedPdf);
router.get("/documents", getDocumentsList);

export default router;
