import type { LessonVideoValue } from "@/components/courses/lesson-video-field";

/** True when the URL points to an uploaded file (local disk or cloud storage). */
export function isUploadedVideoUrl(url: string): boolean {
  if (!url.trim()) return false;
  if (url.startsWith("/uploads/videos/")) return true;
  if (/^https?:\/\//i.test(url) && /\/videos\//i.test(url)) return true;
  if (/^https?:\/\//i.test(url) && /\.(mp4|webm|mov)(\?|$)/i.test(url)) return true;
  return false;
}

export function isExternalVideoUrl(url: string): boolean {
  if (!url.trim()) return false;
  if (isUploadedVideoUrl(url)) return false;
  return /^https?:\/\//i.test(url);
}

export function hasUploadedVideo(
  value: Pick<
    LessonVideoValue,
    "videoUrl" | "videoStorageKey" | "videoStorageProvider"
  >,
): boolean {
  if (!value.videoUrl?.trim()) return false;
  if (value.videoStorageKey || value.videoStorageProvider) return true;
  return isUploadedVideoUrl(value.videoUrl);
}

export function isCloudStoredVideo(value: LessonVideoValue): boolean {
  return value.videoStorageProvider === "r2" || value.videoStorageProvider === "s3";
}
