import type { CourseStatus, EntityStatus, Role } from "@lms/database";
import { ApiError } from "../../utils/api-error.js";

export function activeEntityFilter() {
  return { deleteStatus: "ACTIVE" as const };
}

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

export function assertCanRequestDelete(
  course: { status: CourseStatus; deleteStatus: EntityStatus },
  role: Role,
): void {
  if (role === "ADMIN") return;
  if (course.status === "ARCHIVED") {
    throw ApiError.badRequest("Archived courses cannot be modified");
  }
  if (course.deleteStatus === "PENDING_DELETE") {
    throw ApiError.badRequest("A delete request is already pending for this course");
  }
}

export function assertTeacherOwnsOrAdmin(
  userId: string,
  role: Role,
  teacherId: string,
): boolean {
  return role === "ADMIN" || (role === "TEACHER" && userId === teacherId);
}
