import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 4000;
const DB_RETRY_MS = Number(process.env.DB_RETRY_MS || 10000);
const DB_CONNECT_ATTEMPT_TIMEOUT_MS = Number(process.env.DB_CONNECT_ATTEMPT_TIMEOUT_MS || 12000);

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`DB connect timed out after ${timeoutMs}ms`)), timeoutMs)),
  ]);

const connectWithRetry = async () => {
  try {
    await withTimeout(connectDB(), DB_CONNECT_ATTEMPT_TIMEOUT_MS);
    console.log("Database connected.");
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    console.log(`Retrying database connection in ${DB_RETRY_MS / 1000}s...`);
    setTimeout(connectWithRetry, DB_RETRY_MS);
  }
};

app.listen(PORT, () => {
  console.log(`SignFlow server running on http://localhost:${PORT}`);
  connectWithRetry();
});
