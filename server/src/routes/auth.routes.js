import { Router } from "express";
import { login, logout, me, register, updateProfile } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);
router.patch("/update-profile", authMiddleware, updateProfile);

router.post(
  "/register",
  authMiddleware,
  roleMiddleware(ROLES.SUPERADMIN, ROLES.ADMIN),
  register
);

export default router;
