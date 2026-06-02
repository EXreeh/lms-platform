import { TOKEN_COOKIE } from "./constants";
import type { Role } from "@/types/auth";
import { DASHBOARD_PATHS } from "@/types/auth";

/** Legacy localStorage key — cleared on logout for backwards compatibility */
const LEGACY_KEY = "lms_token";

/**
 * Sync a readable cookie for Next.js middleware route guards.
 * Primary auth token is httpOnly and set by the API (via proxy).
 */
export function syncMiddlewareCookie(token: string): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 7;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
  localStorage.setItem(LEGACY_KEY, token);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LEGACY_KEY);
}

export function clearAuthStorage(): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax${secure}`;
  localStorage.removeItem(LEGACY_KEY);
}

export function getDashboardPathForRole(role: Role): string {
  return DASHBOARD_PATHS[role];
}
