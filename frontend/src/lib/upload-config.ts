import { formatFileSize } from "@/lib/format-file-size";

function parseLimitMb(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const MAX_VIDEO_UPLOAD_MB = parseLimitMb(
  process.env.NEXT_PUBLIC_MAX_VIDEO_UPLOAD_MB,
  500,
);
export const MAX_RESOURCE_UPLOAD_MB = parseLimitMb(
  process.env.NEXT_PUBLIC_MAX_RESOURCE_UPLOAD_MB,
  50,
);
export const MAX_THUMBNAIL_UPLOAD_MB = 5;

export function getMaxVideoBytes(): number {
  return MAX_VIDEO_UPLOAD_MB * 1024 * 1024;
}

export function getMaxResourceBytes(): number {
  return MAX_RESOURCE_UPLOAD_MB * 1024 * 1024;
}

export function getMaxThumbnailBytes(): number {
  return MAX_THUMBNAIL_UPLOAD_MB * 1024 * 1024;
}

export function getMaxBytesForKind(kind: "video" | "resource" | "thumbnail"): number {
  if (kind === "video") return getMaxVideoBytes();
  if (kind === "resource") return getMaxResourceBytes();
  return getMaxThumbnailBytes();
}

export function isFileTooLargeForKind(
  fileSize: number,
  kind: "video" | "resource" | "thumbnail",
): boolean {
  return fileSize > getMaxBytesForKind(kind);
}

export function videoTooLargeClientMessage(fileSize: number): string {
  return (
    `This video is too large for local upload. Your file is ${formatFileSize(fileSize)}. ` +
    `The current local upload limit is ${MAX_VIDEO_UPLOAD_MB} MB. ` +
    `Large video uploads will be supported after Cloudflare R2/S3 storage is connected.`
  );
}

export function resourceTooLargeClientMessage(fileSize: number): string {
  return (
    `This file is too large for local upload. Your file is ${formatFileSize(fileSize)}. ` +
    `The current local upload limit is ${MAX_RESOURCE_UPLOAD_MB} MB. ` +
    `Large resource uploads will be supported after cloud storage is connected.`
  );
}

export function thumbnailTooLargeClientMessage(fileSize: number): string {
  return (
    `This image is too large. Your file is ${formatFileSize(fileSize)}. ` +
    `The maximum thumbnail size is ${MAX_THUMBNAIL_UPLOAD_MB} MB.`
  );
}

export function tooLargeClientMessage(
  kind: "video" | "resource" | "thumbnail",
  fileSize: number,
): string {
  if (kind === "video") return videoTooLargeClientMessage(fileSize);
  if (kind === "resource") return resourceTooLargeClientMessage(fileSize);
  return thumbnailTooLargeClientMessage(fileSize);
}

export function maxSizeLabelForKind(kind: "video" | "resource" | "thumbnail"): string {
  if (kind === "video") return `${MAX_VIDEO_UPLOAD_MB} MB`;
  if (kind === "resource") return `${MAX_RESOURCE_UPLOAD_MB} MB`;
  return `${MAX_THUMBNAIL_UPLOAD_MB} MB`;
}

export class FileTooLargeError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "VIDEO_FILE_TOO_LARGE"
      | "RESOURCE_FILE_TOO_LARGE"
      | "THUMBNAIL_FILE_TOO_LARGE",
  ) {
    super(message);
    this.name = "FileTooLargeError";
  }
}

export function assertFileWithinLimit(
  file: File,
  kind: "video" | "resource" | "thumbnail",
): void {
  if (!isFileTooLargeForKind(file.size, kind)) return;

  const message = tooLargeClientMessage(kind, file.size);
  const code =
    kind === "video"
      ? "VIDEO_FILE_TOO_LARGE"
      : kind === "resource"
        ? "RESOURCE_FILE_TOO_LARGE"
        : "THUMBNAIL_FILE_TOO_LARGE";

  throw new FileTooLargeError(message, code);
}
