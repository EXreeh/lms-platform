import type { Role } from "@lms/database";

/** Legacy OWNER enum value — treated as ADMIN everywhere in app logic. */
export function isAdminRole(role: Role | undefined): boolean {
  return role === "ADMIN" || role === "OWNER";
}

export function isTeacherRole(role: Role | undefined): boolean {
  return role === "TEACHER";
}

export function isStudentRole(role: Role | undefined): boolean {
  return role === "STUDENT";
}

export function canAccessAdminPanel(role: Role | undefined): boolean {
  return isAdminRole(role);
}

/** Normalize legacy OWNER to ADMIN for API/UI responses. */
export function normalizeAppRole(role: Role): "STUDENT" | "TEACHER" | "ADMIN" {
  if (role === "OWNER") return "ADMIN";
  return role;
}

export function canModifyTargetUser(actorRole: Role, _targetRole: Role): boolean {
  return isAdminRole(actorRole);
}

export function canCreateAdmin(actorRole: Role): boolean {
  return isAdminRole(actorRole);
}

export function canAssignRole(newRole: Role): boolean {
  return newRole === "STUDENT" || newRole === "TEACHER" || newRole === "ADMIN";
}
