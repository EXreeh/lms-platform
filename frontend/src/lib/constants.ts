/**
 * Backend origin only — no trailing slash, no /api suffix.
 * Production: https://lmsdatabase-production.up.railway.app
 * Local direct: http://localhost:4000
 * Local proxy: set NEXT_PUBLIC_API_URL= (empty) for same-origin /api rewrites
 */
function stripApiSuffix(base: string): string {
  return base.replace(/\/+$/, "").replace(/\/api$/i, "");
}

function resolveBackendBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;

  if (raw === "") {
    return "";
  }

  if (raw?.trim()) {
    return stripApiSuffix(raw.trim());
  }

  return "http://localhost:4000";
}

export const BACKEND_BASE_URL = resolveBackendBase();

/** @deprecated Use apiUrl() */
export const API_URL = BACKEND_BASE_URL;

export const TOKEN_COOKIE = "cognitiax_token";

/**
 * Build a full backend API URL. Paths may be `/auth/login` or `/api/auth/login`.
 * Always produces `{BACKEND}/api/...` (never `/login` on the backend root).
 */
export function apiUrl(path: string): string {
  const route = path.startsWith("/") ? path : `/${path}`;
  const apiPath = route.startsWith("/api/") ? route : `/api${route}`;
  return `${BACKEND_BASE_URL}${apiPath}`;
}

/** Multipart uploads — direct backend URL when set, otherwise same as API base. */
export function uploadApiUrl(path: string): string {
  const uploadBase = process.env.NEXT_PUBLIC_BACKEND_API_URL?.trim()
    ? stripApiSuffix(process.env.NEXT_PUBLIC_BACKEND_API_URL.trim())
    : BACKEND_BASE_URL;
  const route = path.startsWith("/") ? path : `/${path}`;
  const apiPath = route.startsWith("/api/") ? route : `/api${route}`;
  return `${uploadBase}${apiPath}`;
}
