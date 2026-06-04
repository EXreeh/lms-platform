import type { LiveClass } from "@/types/institute";
import { apiRequest } from "./api";

function queryString(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function fetchLiveClasses(params?: { batchId?: string; upcoming?: boolean }) {
  const mapped: Record<string, string | undefined> = {};
  if (params?.batchId) mapped.batchId = params.batchId;
  if (params?.upcoming) mapped.upcoming = "true";
  return apiRequest<{ success: boolean; data: LiveClass[] }>(
    `/live-classes${queryString(mapped)}`,
    { auth: true },
  );
}

export function scheduleLiveClass(body: {
  batchId: string;
  teacherId?: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration?: number;
}) {
  return apiRequest<{ success: boolean; data: LiveClass }>("/live-classes", {
    method: "POST",
    body,
    auth: true,
  });
}
