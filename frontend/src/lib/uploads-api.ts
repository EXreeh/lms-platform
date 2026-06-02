import { API_URL } from "./constants";
import { getAuthToken } from "./auth-storage";
import { ApiClientError } from "./api";

export interface UploadResult {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  storageProvider: string;
}

export type UploadKind = "video" | "resource" | "thumbnail";

const ENDPOINTS: Record<UploadKind, string> = {
  video: "/uploads/video",
  resource: "/uploads/resource",
  thumbnail: "/uploads/thumbnail",
};

export function uploadFile(
  kind: UploadKind,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", `${API_URL}${ENDPOINTS[kind]}`);
    xhr.withCredentials = true;

    const token = getAuthToken();
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let data: {
        success?: boolean;
        message?: string;
        code?: string;
        data?: UploadResult;
      } = {};
      try {
        data = JSON.parse(xhr.responseText) as typeof data;
      } catch {
        reject(new ApiClientError("Upload failed", xhr.status));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300 && data.data) {
        resolve(data.data);
        return;
      }

      reject(
        new ApiClientError(
          data.message ?? "Upload failed",
          xhr.status,
          data.code,
        ),
      );
    };

    xhr.onerror = () => {
      reject(new ApiClientError("Upload failed. Check your connection and try again.", 0));
    };

    xhr.send(formData);
  });
}

export function getVideoDurationFromFile(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? Math.floor(video.duration) : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    video.src = url;
  });
}

export function inferResourceTypeFromMime(mime: string): import("@/types/resource").ResourceType {
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return "OTHER";
  if (mime.includes("word") || mime.includes("document") || mime.includes("presentation")) {
    return mime.includes("presentation") ? "OTHER" : "ASSIGNMENT";
  }
  if (mime.includes("zip")) return "OTHER";
  return "LINK";
}
