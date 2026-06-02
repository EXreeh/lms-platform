import { formatFileSize } from "@/lib/format-file-size";

export const MAX_VIDEO_UPLOAD_MB = Number(
  process.env.NEXT_PUBLIC_MAX_VIDEO_UPLOAD_MB ?? 500,
);
export const MAX_RESOURCE_UPLOAD_MB = Number(
  process.env.NEXT_PUBLIC_MAX_RESOURCE_UPLOAD_MB ?? 50,
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

export function videoTooLargeClientMessage(fileSize: number): string {
  return `This video is ${formatFileSize(fileSize)}. The local upload limit is ${MAX_VIDEO_UPLOAD_MB} MB. Large video uploads require cloud storage. Please use videos below the local upload limit for now.`;
}

export function resourceTooLargeClientMessage(fileSize: number): string {
  return `This file is ${formatFileSize(fileSize)}. The local upload limit is ${MAX_RESOURCE_UPLOAD_MB} MB. Large resource uploads will be supported after cloud storage is connected.`;
}

export function thumbnailTooLargeClientMessage(fileSize: number): string {
  return `This image is ${formatFileSize(fileSize)}. The maximum thumbnail size is ${MAX_THUMBNAIL_UPLOAD_MB} MB.`;
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
