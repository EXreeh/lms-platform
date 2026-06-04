import type { Batch } from "@/types/institute";
import { apiRequest } from "./api";

function queryString(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function fetchBatches(params?: { status?: string; search?: string }) {
  return apiRequest<{ success: boolean; data: Batch[] }>(
    `/batches${queryString(params ?? {})}`,
    { auth: true },
  );
}

export function fetchBatch(batchId: string) {
  return apiRequest<{ success: boolean; data: Batch }>(`/batches/${batchId}`, {
    auth: true,
  });
}

export function createBatch(body: {
  name: string;
  description?: string;
  courseId?: string | null;
  teacherId?: string | null;
  startDate: string;
  endDate?: string | null;
  timing?: string;
  daysOfWeek?: string;
}) {
  return apiRequest<{ success: boolean; data: Batch }>("/batches", {
    method: "POST",
    body,
    auth: true,
  });
}

export function updateBatch(
  batchId: string,
  body: Partial<{
    name: string;
    description: string;
    courseId: string | null;
    teacherId: string | null;
    startDate: string;
    endDate: string | null;
    timing: string;
    daysOfWeek: string;
    status: string;
  }>,
) {
  return apiRequest<{ success: boolean; data: Batch }>(`/batches/${batchId}`, {
    method: "PATCH",
    body,
    auth: true,
  });
}

export function addBatchStudents(batchId: string, studentIds: string[]) {
  return apiRequest<{ success: boolean; data: Batch }>(`/batches/${batchId}/students`, {
    method: "POST",
    body: { studentIds },
    auth: true,
  });
}

export function removeBatchStudent(batchId: string, studentId: string) {
  return apiRequest<{ success: boolean; data: Batch }>(
    `/batches/${batchId}/students/${studentId}`,
    { method: "DELETE", auth: true },
  );
}

export function fetchTeacherBatches() {
  return apiRequest<{ success: boolean; data: Batch[] }>("/batches/teacher", {
    auth: true,
  });
}

export function fetchMyBatch() {
  return apiRequest<{ success: boolean; data: Batch | null }>("/batches/me", {
    auth: true,
  });
}
