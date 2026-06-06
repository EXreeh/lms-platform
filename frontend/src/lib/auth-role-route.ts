import { DASHBOARD_PATHS, type Role } from "@/types/auth";

/** True when a dashboard path belongs to a different role (profile is shared). */
export function isDashboardRoleMismatch(pathname: string, role: Role): boolean {
  if (!pathname.startsWith("/dashboard")) return false;
  if (pathname.startsWith("/dashboard/profile")) return false;

  if (role === "ADMIN") {
    return pathname.startsWith("/dashboard/student");
  }

  if (role === "TEACHER") {
    return (
      pathname.startsWith("/dashboard/admin") ||
      pathname.startsWith("/dashboard/student")
    );
  }

  return (
    pathname.startsWith("/dashboard/admin") ||
    pathname.startsWith("/dashboard/teacher")
  );
}

export function dashboardPathForRole(role: Role): string {
  return DASHBOARD_PATHS[role];
}
