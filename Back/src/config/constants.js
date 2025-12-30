export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const SMTP_HOST = process.env.SMTP_HOST || "";
export const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
export const SMTP_SECURE = process.env.SMTP_SECURE === "true"; // false for 587
export const SMTP_USER = process.env.SMTP_USER || "";
export const SMTP_PASS = process.env.SMTP_PASS || "";
export const MAIL_FROM = process.env.MAIL_FROM || "";

const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");

// Base URLs are provided entirely by environment variables
export const APP_BASE_URL = trimTrailingSlash(process.env.APP_BASE_URL || "");
export const FRONTEND_BASE_URL = trimTrailingSlash(
  process.env.FRONTEND_BASE_URL || ""
);
export const PORT = process.env.PORT;

const requireBaseUrl = (value, name) => {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

export const buildBackendUrl = (pathname) =>
  new URL(pathname, `${requireBaseUrl(APP_BASE_URL, "APP_BASE_URL")}/`).toString();

export const buildFrontendUrl = (pathname) =>
  new URL(
    pathname,
    `${requireBaseUrl(FRONTEND_BASE_URL, "FRONTEND_BASE_URL")}/`
  ).toString();
