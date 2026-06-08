import { env } from "../../config/env.js";
import type { UploadCategory } from "./types.js";

export const MAX_VIDEO_UPLOAD_MB = env.MAX_VIDEO_UPLOAD_MB;
export const MAX_RESOURCE_UPLOAD_MB = env.MAX_RESOURCE_UPLOAD_MB;
export const MAX_THUMBNAIL_UPLOAD_MB = 5;

export function getUploadLimitBytes(category: UploadCategory): number {
  switch (category) {
    case "video":
      return MAX_VIDEO_UPLOAD_MB * 1024 * 1024;
    case "resource":
    case "assignment":
    case "certificate":
      return MAX_RESOURCE_UPLOAD_MB * 1024 * 1024;
    case "thumbnail":
      return MAX_THUMBNAIL_UPLOAD_MB * 1024 * 1024;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function videoTooLargeMessage(fileSizeBytes: number): string {
  return (
    `This video is too large for local upload. Your file is ${formatBytes(fileSizeBytes)}. ` +
    `The current local upload limit is ${MAX_VIDEO_UPLOAD_MB} MB. ` +
    `Large video uploads will be supported after Cloudflare R2/S3 storage is connected.`
  );
}

export function resourceTooLargeMessage(fileSizeBytes: number): string {
  return (
    `This file is too large for local upload. Your file is ${formatBytes(fileSizeBytes)}. ` +
    `The current local upload limit is ${MAX_RESOURCE_UPLOAD_MB} MB. ` +
    `Large resource uploads will be supported after cloud storage is connected.`
  );
}

export function thumbnailTooLargeMessage(fileSizeBytes: number): string {
  return `This image is ${formatBytes(fileSizeBytes)}. The maximum thumbnail size is ${MAX_THUMBNAIL_UPLOAD_MB} MB.`;
}

export function tooLargeMessageForCategory(
  category: UploadCategory,
  fileSizeBytes: number,
): string {
  if (category === "video") return videoTooLargeMessage(fileSizeBytes);
  if (category === "resource") return resourceTooLargeMessage(fileSizeBytes);
  return thumbnailTooLargeMessage(fileSizeBytes);
}

export function tooLargeLimitMessage(category: UploadCategory): string {
  if (category === "video") {
    return `Large video uploads require cloud storage. Please use videos below the local upload limit of ${MAX_VIDEO_UPLOAD_MB} MB for now.`;
  }
  if (category === "resource") {
    return `Large resource uploads will be supported after cloud storage is connected. The local limit is ${MAX_RESOURCE_UPLOAD_MB} MB.`;
  }
  return `The maximum thumbnail size is ${MAX_THUMBNAIL_UPLOAD_MB} MB.`;
}

export function tooLargeCodeForCategory(category: UploadCategory): string {
  if (category === "video") return "VIDEO_FILE_TOO_LARGE";
  if (category === "resource") return "RESOURCE_FILE_TOO_LARGE";
  return "THUMBNAIL_FILE_TOO_LARGE";
}
