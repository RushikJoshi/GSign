import mongoose from "mongoose";
import dns from "dns";

let connectPromise = null;

export const isDbConnected = () => mongoose.connection.readyState === 1;

export const connectDB = async () => {
  if (isDbConnected()) {
    return;
  }

  if (connectPromise) {
    return connectPromise;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables.");
  }

  const dnsServers = process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1";
  const resolverList = dnsServers
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (resolverList.length) {
    try {
      dns.setServers(resolverList);
      // Using public resolvers avoids local DNS that may block SRV lookups (ECONNREFUSED).
    } catch {
      // If custom DNS is invalid, Node will continue with system DNS.
    }
  }

  connectPromise = mongoose.connect(mongoUri, {
    dbName: process.env.MONGO_DB_NAME || "gitakshmi_sign",
    serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS || 10000),
    connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 10000),
    socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 20000),
    family: Number(process.env.MONGO_DNS_FAMILY || 4),
  });

  try {
    await connectPromise;
  } finally {
    connectPromise = null;
  }
};
