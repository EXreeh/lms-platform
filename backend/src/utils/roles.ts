import type { Role } from "@lms/database";

export const OWNER_ROLE: Role = "OWNER";

export function isOwner(role: Role | undefined): boolean {
  return role === "OWNER";
}

export function isAdminRole(role: Role | undefined): boolean {
  return role === "ADMIN" || role === "OWNER";
}

export function isTeacherRole(role: Role | undefined): boolean {
  return role === "TEACHER";
}

export function isStudentRole(role: Role | undefined): boolean {
  return role === "STUDENT";
}

/** Institute admin panel (ADMIN + OWNER). */
export function canAccessAdminPanel(role: Role | undefined): boolean {
  return isAdminRole(role);
}

/** Platform owner-only actions (create/disable admins, audit logs, security). */
export function canManagePlatform(role: Role | undefined): boolean {
  return isOwner(role);
}

export function canModifyTargetUser(actorRole: Role, targetRole: Role): boolean {
  if (targetRole === "OWNER") return false;
  if (targetRole === "ADMIN") return actorRole === "OWNER";
  return isAdminRole(actorRole);
}

export function canCreateAdmin(actorRole: Role): boolean {
  return actorRole === "OWNER";
}

export function canChangeRoleTo(actorRole: Role, newRole: Role, targetRole: Role): boolean {
  if (targetRole === "OWNER" || newRole === "OWNER") {
    return actorRole === "OWNER";
  }
  if (newRole === "ADMIN" && actorRole !== "OWNER") return false;
  if (targetRole === "ADMIN" && actorRole !== "OWNER") return false;
  return isAdminRole(actorRole);
}
