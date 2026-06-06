import { DASHBOARD_PATHS, type Role } from "@/types/auth";

/** Allow only same-app relative paths (no protocol-relative or external URLs). */
export function getSafeRedirectPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/login") || value.startsWith("/register")) return null;
  return value;
}

/** Post-login destination — never send a user to another role's dashboard. */
export function getDashboardRedirectForRole(
  role: Role,
  redirectTo?: string | null,
): string {
  const safe = getSafeRedirectPath(redirectTo ?? null);
  if (!safe) return DASHBOARD_PATHS[role];

  if (safe.startsWith("/dashboard/profile")) return safe;

  if (role === "ADMIN") return safe;

  if (role === "TEACHER") {
    if (safe.startsWith("/dashboard/teacher")) return safe;
    return DASHBOARD_PATHS.TEACHER;
  }

  if (safe.startsWith("/dashboard/student")) return safe;
  return DASHBOARD_PATHS.STUDENT;
}
