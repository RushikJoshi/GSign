import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { promises as fsp } from "fs";
import authRoutes from "./routes/auth.routes.js";
import superAdminRoutes from "./routes/superAdmin.routes.js";
import companyAdminRoutes from "./routes/companyAdmin.routes.js";
import userRoutes from "./routes/user.routes.js";
import documentManagementRoutes from "./routes/documentManagement.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import signatureRoutes from "./routes/signature.routes.js";
import signingRoutes from "./routes/signing.routes.js";
import templateRoutes from "./routes/template.routes.js";
import { isDbConnected } from "./config/db.js";

const app = express();

const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const envOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed."));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const uploadsPath = path.join(process.cwd(), "uploads");
await fsp.mkdir(path.join(uploadsPath, "documents"), { recursive: true });
await fsp.mkdir(path.join(uploadsPath, "certificates"), { recursive: true });
await fsp.mkdir(path.join(uploadsPath, "signed"), { recursive: true });
app.use("/uploads", express.static(uploadsPath));

app.get("/health", (_req, res) => {
  return res.status(200).json({
    ok: true,
    service: "SignFlow API",
    dbConnected: isDbConnected(),
  });
});

app.use((req, res, next) => {
  if (req.path === "/health") {
    return next();
  }

  if (!isDbConnected()) {
    return res.status(503).json({ message: "Database is not connected yet. Please retry shortly." });
  }

  return next();
});

app.use("/api/auth", authRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/company-admin", companyAdminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/dms", documentManagementRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/signature", signatureRoutes);
app.use("/api/signing", signingRoutes);
app.use("/api/templates", templateRoutes);

app.use((error, _req, res, _next) => {
  return res.status(error.status || 500).json({ message: error.message || "Internal server error." });
});

export default app;
