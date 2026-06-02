import type { User, Role } from "@/types/auth";
import { logoutUser } from "@/lib/auth-api";
import { clearAuthStorage } from "@/lib/auth-storage";
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

/** Clears client auth storage and httpOnly cookie via backend logout. */
export async function destroySession(): Promise<void> {
  clearAuthStorage();
  try {
    await logoutUser();
  } catch {
    // Cookie may already be invalid — local state is cleared regardless
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
