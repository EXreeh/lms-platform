import type { AccessType } from "@/types/institute";
import type { Course } from "@/types/course";
import type { EnrollmentRecord } from "@/types/learning";
import { apiRequest } from "./api";

function queryString(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export interface CourseAccessRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  accessType: AccessType;
  lifetimeAccess: boolean;
  startsAt: string;
  expiresAt: string | null;
  assignedByName: string;
}

export interface AssignedCourse {
  accessId: string | null;
  accessType: AccessType;
  lifetimeAccess: boolean;
  accessActive: boolean;
  accessLabel: string;
  enrollment: EnrollmentRecord | null;
  course: Course;
}

export function fetchMyAssignedCourses() {
  return apiRequest<{ success: boolean; data: AssignedCourse[] }>("/course-access/my-courses", {
    auth: true,
  });
}

export function fetchCourseAccessList(params?: { studentId?: string; courseId?: string }) {
  return apiRequest<{ success: boolean; data: CourseAccessRecord[] }>(
    `/course-access${queryString(params ?? {})}`,
    { auth: true },
  );
}

export function assignCourseToStudent(body: {
  studentId: string;
  courseId: string;
  accessType?: AccessType;
  lifetimeAccess?: boolean;
  expiresAt?: string | null;
}) {
  return apiRequest<{ success: boolean; data: { id: string } }>("/course-access/assign", {
    method: "POST",
    auth: true,
    body,
  });
}

export function assignCourseToBatch(batchId: string, courseId: string) {
  return apiRequest<{ success: boolean; data: { batchId: string; courseId: string } }>(
    `/course-access/batches/${batchId}/courses`,
    { method: "POST", auth: true, body: { courseId } },
  );
}

export function revokeCourseAccess(studentId: string, courseId: string) {
  return apiRequest<{ success: boolean }>(`/course-access/${studentId}/${courseId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function grantLifetimeAccess(studentId: string, courseId: string) {
  return apiRequest<{ success: boolean }>(`/course-access/${studentId}/${courseId}/lifetime`, {
    method: "POST",
    auth: true,
  });
}
