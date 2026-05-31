import type { Resource, ResourceType } from "@/types/resource";
import { apiRequest } from "./api";

export function fetchTeacherResources() {
  return apiRequest<{ success: boolean; data: { resources: Resource[] } }>("/resources/mine", {
    auth: true,
  });
}

export function fetchCourseResources(courseId: string) {
  return apiRequest<{ success: boolean; data: { resources: Resource[] } }>(
    `/resources/course/${courseId}`,
    { auth: true },
  );
}

export function fetchLessonResources(lessonId: string) {
  return apiRequest<{ success: boolean; data: { resources: Resource[] } }>(
    `/resources/lesson/${lessonId}`,
    { auth: true },
  );
}

export function fetchCourseResourcesStudent(courseId: string) {
  return apiRequest<{ success: boolean; data: { resources: Resource[] } }>(
    `/resources/course/${courseId}/student`,
    { auth: true },
  );
}

export function fetchLessonResourcesStudent(lessonId: string) {
  return apiRequest<{ success: boolean; data: { resources: Resource[] } }>(
    `/resources/lesson/${lessonId}/student`,
    { auth: true },
  );
}

export function createResource(data: {
  title: string;
  description?: string;
  type: ResourceType;
  url: string;
  fileName?: string;
  courseId: string;
  lessonId?: string | null;
}) {
  return apiRequest<{ success: boolean; data: { resource: Resource } }>("/resources", {
    method: "POST",
    body: {
      ...data,
      lessonId: data.lessonId ?? null,
    },
    auth: true,
  });
}

export function updateResource(
  resourceId: string,
  data: Partial<{ title: string; description: string; type: ResourceType; url: string; fileName: string }>,
) {
  return apiRequest<{ success: boolean; data: { resource: Resource } }>(`/resources/${resourceId}`, {
    method: "PATCH",
    body: data,
    auth: true,
  });
}

export function deleteResource(resourceId: string) {
  return apiRequest<{ success: boolean; message: string; pendingApproval?: boolean }>(
    `/resources/${resourceId}`,
    { method: "DELETE", auth: true },
  );
}
