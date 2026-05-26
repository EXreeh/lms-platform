import type {
  AnalyticsResponse,
  ContinueLearningResponse,
  CourseProgressResponse,
  EnrollmentsResponse,
  LessonActionResponse,
} from "@/types/learning";
import { apiRequest } from "./api";

export function enrollInCourseLearning(slug: string) {
  return apiRequest<{ success: boolean; data: { message: string } }>(
    `/learning/courses/${slug}/enroll`,
    { method: "POST", auth: true },
  );
}

export function fetchEnrolledCourses() {
  return apiRequest<EnrollmentsResponse>("/learning/enrollments", { method: "GET", auth: true });
}

export function fetchCourseProgress(slug: string) {
  return apiRequest<CourseProgressResponse>(`/learning/courses/${slug}/progress`, {
    method: "GET",
    auth: true,
  });
}

export function markLessonComplete(lessonId: string) {
  return apiRequest<LessonActionResponse>(`/learning/lessons/${lessonId}/complete`, {
    method: "POST",
    auth: true,
  });
}

export function updateWatchProgress(lessonId: string, watchedDuration: number) {
  return apiRequest<LessonActionResponse>(`/learning/lessons/${lessonId}/watch`, {
    method: "PATCH",
    body: { watchedDuration },
    auth: true,
  });
}

export function fetchContinueLearning() {
  return apiRequest<ContinueLearningResponse>("/learning/continue", { method: "GET", auth: true });
}

export function fetchStudentAnalytics() {
  return apiRequest<AnalyticsResponse>("/learning/analytics", { method: "GET", auth: true });
}
