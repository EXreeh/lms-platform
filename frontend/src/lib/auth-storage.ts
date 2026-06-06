import { TOKEN_COOKIE } from "./constants";
import type { Role } from "@/types/auth";
import { DASHBOARD_PATHS } from "@/types/auth";

/** Legacy localStorage key — cleared on logout for backwards compatibility */
const LEGACY_KEY = "lms_token";

function cookieFlags(): string {
  if (typeof window === "undefined") return "";
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const sameSite =
    window.location.protocol === "https:" ? "; SameSite=None" : "; SameSite=Lax";
  return `${secure}${sameSite}`;
}

/**
 * Sync a readable cookie for Next.js middleware route guards.
 * Primary auth token is httpOnly and set by the API (via proxy).
 */
export function syncMiddlewareCookie(token: string): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}${cookieFlags()}`;
  localStorage.setItem(LEGACY_KEY, token);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LEGACY_KEY);
}

export function clearAuthStorage(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0${cookieFlags()}`;
  localStorage.removeItem(LEGACY_KEY);
}

export function clearClientSessionStorage(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.clear();
}

/** Remove auth-related client caches; preserves theme preference. */
export function clearAuthClientCaches(): void {
  if (typeof window === "undefined") return;
  clearAuthStorage();
  clearClientSessionStorage();
  const preserve = new Set(["cognitiax-theme"]);
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || preserve.has(key)) continue;
    if (
      key === LEGACY_KEY ||
      key.startsWith("lms_") ||
      key.startsWith("cognitiax_auth") ||
      key.startsWith("dashboard_")
    ) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}

export function getDashboardPathForRole(role: Role): string {
  return DASHBOARD_PATHS[role];
}
