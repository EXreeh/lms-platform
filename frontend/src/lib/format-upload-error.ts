import { ApiClientError } from "./api";
import type { UploadKind } from "./uploads-api";
import {
  isFileTooLargeForKind,
  MAX_RESOURCE_UPLOAD_MB,
  MAX_THUMBNAIL_UPLOAD_MB,
  MAX_VIDEO_UPLOAD_MB,
  resourceTooLargeClientMessage,
  thumbnailTooLargeClientMessage,
  tooLargeClientMessage,
  videoTooLargeClientMessage,
} from "./upload-config";

export function formatUploadError(
  err: unknown,
  kind: UploadKind,
  fileSize?: number,
): string {
  if (err instanceof ApiClientError) {
    if (
      fileSize != null &&
      isFileTooLargeForKind(fileSize, kind) &&
      (err.code === "VIDEO_FILE_TOO_LARGE" ||
        err.code === "RESOURCE_FILE_TOO_LARGE" ||
        err.code === "THUMBNAIL_FILE_TOO_LARGE" ||
        err.code === "FILE_TOO_LARGE" ||
        err.status === 413)
    ) {
      return tooLargeClientMessage(kind, fileSize);
    }

    switch (err.code) {
      case "VIDEO_FILE_TOO_LARGE":
        return fileSize != null
          ? videoTooLargeClientMessage(fileSize)
          : `Large video uploads require cloud storage. The local limit is ${MAX_VIDEO_UPLOAD_MB} MB.`;
      case "RESOURCE_FILE_TOO_LARGE":
        return fileSize != null
          ? resourceTooLargeClientMessage(fileSize)
          : `Large resource uploads will be supported after cloud storage is connected. The local limit is ${MAX_RESOURCE_UPLOAD_MB} MB.`;
      case "THUMBNAIL_FILE_TOO_LARGE":
        return fileSize != null
          ? thumbnailTooLargeClientMessage(fileSize)
          : `The maximum thumbnail size is ${MAX_THUMBNAIL_UPLOAD_MB} MB.`;
      case "FILE_TOO_LARGE":
        return fileSize != null
          ? tooLargeClientMessage(kind, fileSize)
          : "File too large for this upload type.";
      case "INVALID_FILE_TYPE":
      case "INVALID_FILE":
        return err.message?.trim() || "Unsupported file type for this upload.";
      case "NO_FILE":
        return "Please select a file to upload.";
      case "UNAUTHORIZED":
        return "Please sign in to upload files.";
      case "FORBIDDEN":
        return "You do not have permission to upload files.";
      case "STORAGE_ERROR":
      case "STORAGE_UNAVAILABLE":
      case "STORAGE_PERMISSION":
      case "STORAGE_FAILURE":
        return err.message?.trim() || "File storage is unavailable. Please try again or contact support.";
      case "NETWORK_ERROR":
        return err.message?.trim() || "Network error during upload.";
      case "UPLOAD_ERROR":
        return err.message?.trim() || "Upload failed due to a server error. Please try again.";
      default:
        break;
    }

    if (err.message?.trim()) {
      return err.message;
    }

    if (err.status === 401) return "Please sign in to upload files.";
    if (err.status === 403) return "You do not have permission to upload files.";
    if (err.status === 413 && fileSize != null) return tooLargeClientMessage(kind, fileSize);
    if (err.status >= 500) return "File storage is unavailable. Please try again or contact support.";
  }

  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }

  return "Something went wrong with the upload. Please try again.";
}
