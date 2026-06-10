import type {
  ActivityItem,
  AdminCourse,
  AdminUser,
  AdminUserDetail,
  CourseAnalytics,
  ListActivityParams,
  ListCoursesParams,
  ListUsersParams,
  Pagination,
} from "@/types/admin";
import { apiRequest } from "./api";

function queryString(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function fetchAdminUsers(params: ListUsersParams = {}) {
  return apiRequest<{ success: boolean; data: { users: AdminUser[]; pagination: Pagination } }>(
    `/admin/users${queryString(params as Record<string, string | number | boolean | undefined>)}`,
    { auth: true },
  );
}

export function fetchAdminUser(userId: string) {
  return apiRequest<{ success: boolean; data: AdminUserDetail }>(`/admin/users/${userId}`, {
    auth: true,
  });
}

export interface CreateAccountOptions {
  batchId?: string | null;
  courseId?: string | null;
  feePlan?: { totalAmount: number; dueDate: string } | null;
  salary?: {
    month: number;
    year: number;
    baseSalary: number;
    bonus?: number;
    deductions?: number;
  } | null;
}

export function createStudentAccount(
  body: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  } & CreateAccountOptions,
) {
  return apiRequest<{
    success: boolean;
    data: {
      user: AdminUser;
      credentialsDelivered: { messageSent: boolean; emailSent: boolean };
    };
  }>("/admin/users/students", {
    method: "POST",
    body,
    auth: true,
  });
}

export function createAdminAccount(body: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  return apiRequest<{
    success: boolean;
    data: {
      user: AdminUser;
      credentialsDelivered: { messageSent: boolean; emailSent: boolean };
    };
  }>("/admin/users/admins", {
    method: "POST",
    body,
    auth: true,
  });
}

export function createTeacherAccount(
  body: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  } & CreateAccountOptions,
) {
  return apiRequest<{
    success: boolean;
    data: {
      user: AdminUser;
      credentialsDelivered: { messageSent: boolean; emailSent: boolean };
    };
  }>("/admin/users/teachers", {
    method: "POST",
    body,
    auth: true,
  });
}

export function changeUserRole(userId: string, role: "STUDENT" | "TEACHER" | "ADMIN") {
  return apiRequest<{ success: boolean; data: { user: AdminUser } }>(
    `/admin/users/${userId}/role`,
    { method: "PATCH", body: { role }, auth: true },
  );
}

export function suspendUser(userId: string, suspended: boolean) {
  return apiRequest<{ success: boolean; data: { user: AdminUser } }>(
    `/admin/users/${userId}/suspend`,
    { method: "PATCH", body: { suspended }, auth: true },
  );
}

export function deleteAdminUser(userId: string) {
  return apiRequest<{ success: boolean; message: string }>(`/admin/users/${userId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function resetUserPassword(userId: string, password: string) {
  return apiRequest<{ success: boolean; message: string }>(
    `/admin/users/${userId}/reset-password`,
    { method: "POST", body: { password }, auth: true },
  );
}

export function fetchAdminCourses(params: ListCoursesParams = {}) {
  const query = { ...params } as Record<string, string | number | boolean | undefined>;
  if (params.activeOnly) query.activeOnly = "true";
  return apiRequest<{ success: boolean; data: { courses: AdminCourse[]; pagination: Pagination } }>(
    `/admin/courses${queryString(query)}`,
    { auth: true },
  );
}

export function archiveDemoCourses() {
  return apiRequest<{
    success: boolean;
    data: { archived: number; courses: { id: string; title: string; slug: string }[] };
  }>("/admin/courses/archive-demo", { method: "POST", auth: true });
}

export function fetchCourseAnalytics(courseId: string) {
  return apiRequest<{ success: boolean; data: CourseAnalytics }>(
    `/admin/courses/${courseId}/analytics`,
    { auth: true },
  );
}

export function fetchReviewQueue() {
  return apiRequest<{ success: boolean; data: { courses: import("@/types/course").Course[] } }>(
    "/admin/review-queue",
    { auth: true },
  );
}

export function fetchPendingDeletes() {
  return apiRequest<{
    success: boolean;
    data: {
      courses: { id: string; title: string; slug: string }[];
      modules: { id: string; title: string; courseId: string }[];
      lessons: { id: string; title: string; moduleId: string }[];
      quizzes: { id: string; title: string; lessonId: string }[];
    };
  }>("/admin/pending-deletes", { auth: true });
}

export function approveCourse(courseId: string) {
  return apiRequest<{ success: boolean; data: { course: AdminCourse } }>(
    `/admin/courses/${courseId}/approve`,
    { method: "PATCH", body: { approved: true }, auth: true },
  );
}

export function rejectCourse(courseId: string, reason?: string) {
  return apiRequest<{ success: boolean; data: { course: AdminCourse } }>(
    `/admin/courses/${courseId}/reject`,
    { method: "PATCH", body: { reason }, auth: true },
  );
}

export function approveDeleteRequest(
  entityType: "course" | "module" | "lesson" | "quiz",
  entityId: string,
) {
  return apiRequest<{ success: boolean; message: string }>("/admin/pending-deletes/approve", {
    method: "POST",
    body: { entityType, entityId },
    auth: true,
  });
}

export function rejectDeleteRequest(
  entityType: "course" | "module" | "lesson" | "quiz",
  entityId: string,
) {
  return apiRequest<{ success: boolean; message: string }>("/admin/pending-deletes/reject", {
    method: "POST",
    body: { entityType, entityId },
    auth: true,
  });
}

export function adminPublishCourse(courseId: string) {
  return approveCourse(courseId);
}

export function adminArchiveCourse(courseId: string) {
  return apiRequest<{ success: boolean; data: { course: AdminCourse } }>(
    `/admin/courses/${courseId}/archive`,
    { method: "PATCH", auth: true },
  );
}

export function adminDeleteCourse(courseId: string) {
  return apiRequest<{ success: boolean; message: string }>(`/admin/courses/${courseId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function fetchAdminActivity(params: ListActivityParams = {}) {
  return apiRequest<{
    success: boolean;
    data: { activities: ActivityItem[]; pagination: Pagination };
  }>(`/admin/activity${queryString(params as Record<string, string | number | boolean | undefined>)}`, {
    auth: true,
  });
}

export function fetchStudentGrowth(days = 90) {
  return apiRequest<{
    success: boolean;
    data: { series: { date: string; count: number }[]; total: number; days: number };
  }>(`/admin/analytics/student-growth?days=${days}`, { auth: true });
}

export function fetchCoursePreview(slug: string) {
  return apiRequest<{ success: boolean; data: import("@/types/learning").CourseProgressData }>(
    `/learning/preview/${slug}`,
    { auth: true },
  );
}

export function fetchAdminResources() {
  return apiRequest<{ success: boolean; data: { resources: import("@/types/resource").Resource[] } }>(
    "/admin/resources",
    { auth: true },
  );
}

export function removeAdminResource(resourceId: string) {
  return apiRequest<{ success: boolean; message: string }>(`/admin/resources/${resourceId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function restoreAdminResource(resourceId: string) {
  return apiRequest<{ success: boolean; message: string }>(
    `/admin/resources/${resourceId}/restore`,
    { method: "PATCH", auth: true },
  );
}

export function fetchAdminCertificates() {
  return apiRequest<{ success: boolean; data: { certificates: import("@/types/certificate").Certificate[] } }>(
    "/admin/certificates",
    { auth: true },
  );
}

export async function downloadAdminCertificate(certificateId: string, filename: string) {
  const { getAuthToken } = await import("./auth-storage");
  const { apiUrl } = await import("./constants");
  const token = getAuthToken();
  const res = await fetch(apiUrl(`/admin/certificates/${certificateId}/download`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? "Download failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
