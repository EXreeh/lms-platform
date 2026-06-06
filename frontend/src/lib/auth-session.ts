import type { User, Role } from "@/types/auth";
import { logoutUser } from "@/lib/auth-api";
import { clearAuthClientCaches } from "@/lib/auth-storage";
import { logAuth } from "@/lib/auth-debug";
import { ApiClientError } from "@/lib/api";

export const VALID_ROLES: Role[] = ["STUDENT", "TEACHER", "ADMIN"];

export function isValidRole(role: unknown): role is Role {
  return typeof role === "string" && VALID_ROLES.includes(role as Role);
}

export function isValidUser(user: User | null | undefined): user is User {
  return Boolean(
    user?.id &&
      user.email &&
      user.firstName &&
      user.lastName &&
      isValidRole(user.role),
  );
}

export function isAuthSessionError(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    return error.status === 401 || error.status === 403 || error.status === 404;
  }
  return false;
}

/** Synchronous client cleanup (navbar → public immediately). */
export function clearClientAuthState(): void {
  clearAuthClientCaches();
  logAuth("state:cleared");
}

/** Backend logout + client cleanup (for invalid /me, etc.). */
export async function destroySession(): Promise<void> {
  logAuth("destroySession:start");
  try {
    await logoutUser();
    logAuth("destroySession:logout-ok");
  } catch (error) {
    logAuth("destroySession:logout-failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
  } finally {
    clearClientAuthState();
    logAuth("destroySession:client-cleared");
  }
}

export function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    /^\/courses\/[^/]+\/learn(\/|$)/.test(pathname) ||
    /^\/courses\/[^/]+\/quizzes(\/|$)/.test(pathname) ||
    /^\/courses\/[^/]+\/certificate(\/|$)/.test(pathname)
  );
}
