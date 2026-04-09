import { Router } from "express";
import { sendOTP, verifyOTP, signDocument, getDocumentByToken, streamDocumentPreview, uploadSelfie } from "../controllers/signing.controller.js";

const router = Router();

/**
 * @desc Get document details via token link
 * @route GET /api/signing/document/:token
 */
router.get("/document/:token", getDocumentByToken);

/**
 * @desc Stream document PDF preview
 * @route GET /api/signing/document/:token/preview
 */
router.get("/document/:token/preview", streamDocumentPreview);

/**
 * @desc Send 6-digit OTP to signer email
 * @route POST /api/signing/send-otp
 */
router.post("/send-otp", sendOTP);

/**
 * @desc Verify 6-digit OTP code
 * @route POST /api/signing/verify-otp
 */
router.post("/verify-otp", verifyOTP);

/**
 * @desc Upload live selfie for verification
 * @route POST /api/signing/upload-selfie
 */
router.post("/upload-selfie", uploadSelfie);

/**
 * @desc Finalize document signing
 * @route POST /api/signing/sign-document
 */
router.post("/sign-document", signDocument);

export default router;
