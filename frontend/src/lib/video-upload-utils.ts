import type { LessonVideoValue } from "@/components/courses/lesson-video-field";
import {
  buildPublicMediaUrl,
  isAbsoluteVideoUrl,
  isPrivateR2Url,
  normalizeObjectKey,
  resolvePublicMediaUrl,
} from "@/lib/media-url-utils";

/** True when the URL points to an uploaded file (local disk or cloud storage). */
export function isUploadedVideoUrl(url: string): boolean {
  if (!url.trim()) return false;
  if (url.startsWith("/uploads/videos/")) return true;
  if (/^videos\//i.test(url)) return true;
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
  if (value.videoStorageKey || value.videoStorageProvider) return true;
  return Boolean(value.videoUrl?.trim()) && isUploadedVideoUrl(value.videoUrl);
}

export function isCloudStoredVideo(value: LessonVideoValue): boolean {
  return value.videoStorageProvider === "r2" || value.videoStorageProvider === "s3";
}

/** Resolve a playable public URL for uploaded R2 videos. */
export function resolveVideoPlaybackUrl(value: {
  videoUrl?: string | null;
  videoStorageKey?: string | null;
  videoStorageProvider?: string | null;
}): string | null {
  if (value.videoStorageProvider === "r2" && value.videoStorageKey) {
    const key = normalizeObjectKey(
      value.videoStorageKey.includes("/")
        ? value.videoStorageKey
        : `videos/${value.videoStorageKey}`,
    );
    return buildPublicMediaUrl(key);
  }

  const rawUrl = value.videoUrl?.trim();
  if (!rawUrl) return null;

  if (isAbsoluteVideoUrl(rawUrl)) return rawUrl;

  const resolved = resolvePublicMediaUrl(rawUrl);
  if (resolved) return resolved;

  if (isPrivateR2Url(rawUrl)) return null;

  return rawUrl.startsWith("http") ? rawUrl : null;
}
