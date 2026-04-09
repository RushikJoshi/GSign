import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "2h";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

const readRequiredSecret = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is missing.`);
  }
  return value;
};

export const signAccessToken = (payload) => {
  return jwt.sign(payload, readRequiredSecret("JWT_ACCESS_SECRET"), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, readRequiredSecret("JWT_REFRESH_SECRET"), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token) => jwt.verify(token, readRequiredSecret("JWT_ACCESS_SECRET"));
export const verifyRefreshToken = (token) => jwt.verify(token, readRequiredSecret("JWT_REFRESH_SECRET"));
