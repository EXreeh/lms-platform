import { UPLOAD_API_URL } from "./constants";
import { getAuthToken } from "./auth-storage";
import { ApiClientError } from "./api";
import {
  assertFileWithinLimit,
  FileTooLargeError,
  tooLargeClientMessage,
} from "./upload-config";
import {
  logUploadFileSelected,
  logUploadRequest,
  logUploadResponse,
} from "./upload-debug";

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

function tooLargeCodeForKind(kind: UploadKind): string {
  if (kind === "video") return "VIDEO_FILE_TOO_LARGE";
  if (kind === "resource") return "RESOURCE_FILE_TOO_LARGE";
  return "THUMBNAIL_FILE_TOO_LARGE";
}

function parseUploadResponseBody(raw: string): {
  success?: boolean;
  message?: string;
  code?: string;
  data?: UploadResult;
} {
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as {
      success?: boolean;
      message?: string;
      code?: string;
      data?: UploadResult;
    };
  } catch {
    return { message: raw.replace(/\s+/g, " ").trim().slice(0, 240) };
  }
}

export function uploadFile(
  kind: UploadKind,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  logUploadFileSelected(kind, file);

  try {
    assertFileWithinLimit(file, kind);
  } catch (err) {
    if (err instanceof FileTooLargeError) {
      return Promise.reject(new ApiClientError(err.message, 400, err.code));
    }
    throw err;
  }

  const url = `${UPLOAD_API_URL}${ENDPOINTS[kind]}`;
  logUploadRequest(kind, url);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", url);
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
      const raw = xhr.responseText ?? "";
      logUploadResponse(kind, xhr.status, raw);

      const data = parseUploadResponseBody(raw);

      if (xhr.status >= 200 && xhr.status < 300 && data.data) {
        resolve(data.data);
        return;
      }

      if (xhr.status === 413) {
        reject(
          new ApiClientError(
            tooLargeClientMessage(kind, file.size),
            413,
            tooLargeCodeForKind(kind),
          ),
        );
        return;
      }

      const message =
        data.message ||
        (raw.trim()
          ? `Upload failed (HTTP ${xhr.status}): ${raw.replace(/\s+/g, " ").trim().slice(0, 180)}`
          : `Upload failed (HTTP ${xhr.status}).`);

      reject(
        new ApiClientError(message, xhr.status, data.code ?? inferCodeFromStatus(xhr.status)),
      );
    };

    xhr.onerror = () => {
      logUploadResponse(kind, 0, "(network error — no response body)");
      reject(
        new ApiClientError(
          `Network error while uploading to ${url}. Ensure the backend is running and CORS allows ${typeof window !== "undefined" ? window.location.origin : "this origin"}.`,
          0,
          "NETWORK_ERROR",
        ),
      );
    };

    xhr.onabort = () => {
      reject(new ApiClientError("Upload was cancelled.", 0, "UPLOAD_CANCELLED"));
    };

    xhr.send(formData);
  });
}

function inferCodeFromStatus(status: number): string | undefined {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 413) return "FILE_TOO_LARGE";
  if (status >= 500) return "STORAGE_ERROR";
  return undefined;
}

export function getVideoDurationFromFile(file: File): Promise<number> {
  return new Promise((resolve) => {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(videoUrl);
      resolve(Number.isFinite(video.duration) ? Math.floor(video.duration) : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      resolve(0);
    };
    video.src = videoUrl;
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
