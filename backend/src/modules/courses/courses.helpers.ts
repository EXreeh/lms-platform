import type { CourseStatus, EntityStatus, Role } from "@lms/database";

export function isCatalogVisible(status: CourseStatus, deleteStatus: EntityStatus): boolean {
  return status === "APPROVED" && deleteStatus === "ACTIVE";
}

export function entityFilter(visibility: "public" | "manage" | "admin") {
  if (visibility === "public") return { deleteStatus: "ACTIVE" as const };
  if (visibility === "manage") {
    return { deleteStatus: { in: ["ACTIVE", "PENDING_DELETE"] as EntityStatus[] } };
  }
  return { deleteStatus: { not: "DELETED" as EntityStatus } };
}

export function courseNotDeletedFilter() {
  return { deleteStatus: { not: "DELETED" as EntityStatus } };
}

export function canTeacherEditCourse(status: CourseStatus): boolean {
  return status !== "UNDER_REVIEW" && status !== "ARCHIVED";
}

export function canSubmitForReview(status: CourseStatus): boolean {
  return status === "DRAFT" || status === "REJECTED";
}

export function assertTeacherOwnsOrAdmin(
  userId: string,
  role: Role,
  teacherId: string,
): boolean {
  return role === "ADMIN" || (role === "TEACHER" && userId === teacherId);
}
