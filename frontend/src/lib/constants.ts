export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");

export const TOKEN_COOKIE = "cognitiax_token";

/**
 * Multipart uploads should hit the backend directly when possible.
 * Next.js dev rewrites can fail on larger multipart bodies (~5–10 MB+).
 */
export const UPLOAD_API_URL = (
  process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace(/\/$/, "") ?? API_URL
);
