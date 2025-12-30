export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const SMTP_HOST = process.env.SMTP_HOST || "";
export const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
export const SMTP_SECURE = process.env.SMTP_SECURE === "true"; // false for 587
export const SMTP_USER = process.env.SMTP_USER || "";
export const SMTP_PASS = process.env.SMTP_PASS || "";
export const MAIL_FROM = process.env.MAIL_FROM || "";

export const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");

// Base URLs are provided entirely by environment variables
export const APP_BASE_URL = trimTrailingSlash(process.env.APP_BASE_URL || "");
export const FRONTEND_BASE_URL = trimTrailingSlash(
  process.env.FRONTEND_BASE_URL || ""
);
export const PORT = Number(process.env.PORT);

if (!APP_BASE_URL) {
  throw new Error("APP_BASE_URL is required");
}
if (!FRONTEND_BASE_URL) {
  throw new Error("FRONTEND_BASE_URL is required");
}
if (!Number.isFinite(PORT)) {
  throw new Error("PORT is required");
}

export const buildBackendUrl = (pathname) =>
  new URL(pathname, APP_BASE_URL).toString();

export const buildFrontendUrl = (pathname) =>
  new URL(pathname, FRONTEND_BASE_URL).toString();
