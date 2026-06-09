import type { LessonVideoValue } from "@/components/courses/lesson-video-field";
import { isPrivateR2Url, resolvePublicMediaUrl } from "@/lib/media-url-utils";

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

const R2_PUBLIC_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, "");

/** Resolve a playable public URL for uploaded R2 videos. */
export function resolveVideoPlaybackUrl(value: {
  videoUrl?: string | null;
  videoStorageKey?: string | null;
  videoStorageProvider?: string | null;
}): string | null {
  const rawUrl = value.videoUrl?.trim();

  if (value.videoStorageProvider === "r2" && R2_PUBLIC_BASE && value.videoStorageKey) {
    const key = value.videoStorageKey.includes("/")
      ? value.videoStorageKey
      : `videos/${value.videoStorageKey}`;
    return `${R2_PUBLIC_BASE}/${key}`;
  }

  if (rawUrl) {
    const resolved = resolvePublicMediaUrl(rawUrl);
    if (resolved) return resolved;
    if (isPrivateR2Url(rawUrl)) return null;
    return rawUrl;
  }

  return null;
}
