import type { LiveClass, LiveClassRecording, LiveClassStats } from "@/types/institute";
import { apiRequest } from "./api";
import { getAuthToken } from "./auth-storage";
import { uploadApiUrl } from "./constants";

function queryString(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

type ListParams = {
  batchId?: string;
  courseId?: string;
  teacherId?: string;
  status?: string;
  upcoming?: boolean;
  from?: string;
  to?: string;
  search?: string;
};

function mapListParams(params?: ListParams): Record<string, string | undefined> {
  if (!params) return {};
  return {
    batchId: params.batchId,
    courseId: params.courseId,
    teacherId: params.teacherId,
    status: params.status,
    upcoming: params.upcoming ? "true" : undefined,
    from: params.from,
    to: params.to,
    search: params.search,
  };
}

export function fetchLiveClasses(params?: ListParams) {
  return apiRequest<{ success: boolean; data: LiveClass[] }>(
    `/live-classes${queryString(mapListParams(params))}`,
    { auth: true },
  );
}

export function fetchAdminLiveClasses(params?: ListParams) {
  return apiRequest<{ success: boolean; data: LiveClass[] }>(
    `/admin/live-classes${queryString(mapListParams(params))}`,
    { auth: true },
  );
}

export function fetchTeacherLiveClasses(params?: ListParams) {
  return apiRequest<{ success: boolean; data: LiveClass[] }>(
    `/teacher/live-classes${queryString(mapListParams(params))}`,
    { auth: true },
  );
}

export function fetchStudentLiveClasses(params?: ListParams) {
  return apiRequest<{ success: boolean; data: LiveClass[] }>(
    `/student/live-classes${queryString(mapListParams(params))}`,
    { auth: true },
  );
}

export function fetchLiveClass(id: string) {
  return apiRequest<{ success: boolean; data: LiveClass }>(`/live-classes/${id}`, { auth: true });
}

export function fetchLiveClassStats() {
  return apiRequest<{ success: boolean; data: LiveClassStats }>(`/live-classes/stats`, {
    auth: true,
  });
}

export function scheduleLiveClass(
  body: {
    batchId: string;
    courseId?: string;
    teacherId?: string;
    title: string;
    description?: string;
    scheduledAt: string;
    durationMinutes?: number;
    liveUrl?: string;
  },
  role: "ADMIN" | "TEACHER" = "ADMIN",
) {
  const path = role === "TEACHER" ? "/teacher/live-classes" : "/admin/live-classes";
  return apiRequest<{ success: boolean; data: LiveClass }>(path, {
    method: "POST",
    body,
    auth: true,
  });
}

export function updateLiveClass(
  id: string,
  body: {
    title?: string;
    description?: string | null;
    scheduledAt?: string;
    durationMinutes?: number;
    status?: string;
    liveUrl?: string | null;
  },
) {
  return apiRequest<{ success: boolean; data: LiveClass }>(`/admin/live-classes/${id}`, {
    method: "PATCH",
    body,
    auth: true,
  });
}

export function cancelLiveClass(id: string) {
  return apiRequest<{ success: boolean; data: LiveClass }>(`/admin/live-classes/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function fetchRecordings(params?: {
  batchId?: string;
  courseId?: string;
  liveClassId?: string;
}) {
  return apiRequest<{ success: boolean; data: LiveClassRecording[] }>(
    `/admin/live-classes/recordings/list${queryString({
      batchId: params?.batchId,
      courseId: params?.courseId,
      liveClassId: params?.liveClassId,
    })}`,
    { auth: true },
  );
}

export function fetchBatchRecordings(batchId: string) {
  return apiRequest<{ success: boolean; data: LiveClassRecording[] }>(
    `/batches/${batchId}/recordings`,
    { auth: true },
  );
}

export function fetchTeacherBatchRecordings(batchId: string) {
  return apiRequest<{ success: boolean; data: LiveClassRecording[] }>(
    `/teacher/live-classes/batches/${batchId}/recordings`,
    { auth: true },
  );
}

export function fetchStudentCourseBatchRecordings(courseId: string) {
  return apiRequest<{
    success: boolean;
    data: {
      batch: { id: string; name: string } | null;
      recordings: LiveClassRecording[];
    };
  }>(`/student/live-classes/courses/${courseId}/batch-recordings`, { auth: true });
}

export function fetchRecording(id: string) {
  return apiRequest<{ success: boolean; data: LiveClassRecording }>(`/recordings/${id}`, {
    auth: true,
  });
}

export function deleteRecording(id: string) {
  return apiRequest<{ success: boolean; message: string }>(`/recordings/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function uploadLiveClassRecording(
  liveClassId: string,
  file: File,
  body: { title: string; description?: string; durationSeconds?: number },
  role: "ADMIN" | "TEACHER" = "TEACHER",
  onProgress?: (percent: number) => void,
): Promise<LiveClassRecording> {
  const path =
    role === "ADMIN"
      ? `/live-classes/${liveClassId}/recordings`
      : `/teacher/live-classes/${liveClassId}/recordings`;
  const url = uploadApiUrl(path);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", body.title);
    if (body.description) formData.append("description", body.description);
    if (body.durationSeconds != null) {
      formData.append("durationSeconds", String(body.durationSeconds));
    }

    xhr.open("POST", url);
    xhr.withCredentials = true;
    const token = getAuthToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as {
          success?: boolean;
          data?: LiveClassRecording;
          message?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300 && data.data) {
          resolve(data.data);
          return;
        }
        reject(new Error(data.message ?? `Upload failed (${xhr.status})`));
      } catch {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during recording upload"));
    xhr.send(formData);
  });
}
