import type {
  Course,
  CourseLevel,
  CourseStatus,
  CoursesListResponse,
  CourseResponse,
  CategoriesResponse,
} from "@/types/course";
import { apiRequest } from "./api";

export interface CourseFilters {
  search?: string;
  category?: string;
  level?: CourseLevel;
  status?: CourseStatus;
  mine?: boolean;
}

function buildQuery(filters: CourseFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.level) params.set("level", filters.level);
  if (filters.status) params.set("status", filters.status);
  if (filters.mine) params.set("mine", "true");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function fetchCourses(filters: CourseFilters = {}, auth = false) {
  return apiRequest<CoursesListResponse>(`/courses${buildQuery(filters)}`, {
    method: "GET",
    auth,
  });
}

export function fetchCourse(slugOrId: string, auth = false) {
  return apiRequest<CourseResponse>(`/courses/${slugOrId}`, { method: "GET", auth });
}

export function fetchCategories() {
  return apiRequest<CategoriesResponse>("/courses/categories", { method: "GET" });
}

export function createCourse(data: Partial<Course> & {
  title: string;
  description: string;
  category: string;
  price: number;
}) {
  return apiRequest<CourseResponse>("/courses", { method: "POST", body: data, auth: true });
}

export function updateCourse(idOrSlug: string, data: Record<string, unknown>) {
  return apiRequest<CourseResponse>(`/courses/${idOrSlug}`, {
    method: "PATCH",
    body: data,
    auth: true,
  });
}

export function deleteCourse(idOrSlug: string) {
  return apiRequest<{ success: boolean; message: string; pendingApproval?: boolean }>(
    `/courses/${idOrSlug}`,
    { method: "DELETE", auth: true },
  );
}

export function publishCourse(idOrSlug: string, published: boolean) {
  return apiRequest<CourseResponse>(`/courses/${idOrSlug}/publish`, {
    method: "PATCH",
    body: { published },
    auth: true,
  });
}

export function submitCourseForReview(idOrSlug: string) {
  return apiRequest<CourseResponse>(`/courses/${idOrSlug}/submit-review`, {
    method: "PATCH",
    auth: true,
  });
}

export function updateModule(moduleId: string, data: { title?: string; order?: number }) {
  return apiRequest<CourseResponse>(`/courses/modules/${moduleId}`, {
    method: "PATCH",
    body: data,
    auth: true,
  });
}

export function updateLesson(
  lessonId: string,
  data: {
    title?: string;
    description?: string;
    videoUrl?: string;
    videoFileName?: string | null;
    videoMimeType?: string | null;
    videoSize?: number | null;
    videoStorageProvider?: string | null;
    videoStorageKey?: string | null;
    duration?: number;
    order?: number;
  },
) {
  return apiRequest<CourseResponse>(`/courses/lessons/${lessonId}`, {
    method: "PATCH",
    body: data,
    auth: true,
  });
}

export function createModule(courseId: string, data: { title: string; order?: number }) {
  return apiRequest<CourseResponse>(`/courses/${courseId}/modules`, {
    method: "POST",
    body: data,
    auth: true,
  });
}

export function deleteModule(moduleId: string) {
  return apiRequest<CourseResponse & { pendingApproval?: boolean; message?: string }>(
    `/courses/modules/${moduleId}`,
    { method: "DELETE", auth: true },
  );
}

export function createLesson(
  moduleId: string,
  data: {
    title: string;
    description?: string;
    videoUrl?: string;
    videoFileName?: string | null;
    videoMimeType?: string | null;
    videoSize?: number | null;
    videoStorageProvider?: string | null;
    videoStorageKey?: string | null;
    duration?: number;
    order?: number;
  },
) {
  return apiRequest<CourseResponse>(`/courses/modules/${moduleId}/lessons`, {
    method: "POST",
    body: data,
    auth: true,
  });
}

export function enrollInCourse(slugOrId: string) {
  return apiRequest<{ success: boolean; data: { message: string } }>(
    `/courses/${slugOrId}/enroll`,
    { method: "POST", auth: true },
  );
}

export function reorderModules(courseId: string, ids: string[]) {
  return apiRequest<CourseResponse>(`/courses/${courseId}/modules/reorder`, {
    method: "PATCH",
    body: { ids },
    auth: true,
  });
}

export function reorderLessons(moduleId: string, ids: string[]) {
  return apiRequest<CourseResponse>(`/courses/modules/${moduleId}/lessons/reorder`, {
    method: "PATCH",
    body: { ids },
    auth: true,
  });
}

export function deleteLesson(lessonId: string) {
  return apiRequest<CourseResponse & { pendingApproval?: boolean; message?: string }>(
    `/courses/lessons/${lessonId}`,
    { method: "DELETE", auth: true },
  );
}
