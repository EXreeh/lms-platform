import type { LessonVideoValue } from "@/components/courses/lesson-video-field";
import {
  buildPublicMediaUrl,
  extractObjectKeyFromLegacyUrl,
  isAbsoluteVideoUrl,
  isLegacyAppUploadUrl,
  isPrivateR2Url,
  normalizeObjectKey,
  resolvePublicMediaUrl,
} from "@/lib/media-url-utils";

/** True when the URL points to an uploaded file (local disk or cloud storage). */
export function isUploadedVideoUrl(url: string): boolean {
  if (!url.trim()) return false;
  if (isLegacyAppUploadUrl(url)) return true;
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

/** Resolve a playable public URL for uploaded R2 videos. Never returns /uploads paths. */
export function resolveVideoPlaybackUrl(value: {
  videoUrl?: string | null;
  videoStorageKey?: string | null;
  videoStorageProvider?: string | null;
}): string | null {
  if (value.videoStorageKey) {
    const key = normalizeObjectKey(
      value.videoStorageKey.includes("/")
        ? value.videoStorageKey
        : `videos/${value.videoStorageKey}`,
    );
    if (key.startsWith("videos/")) {
      const built = buildPublicMediaUrl(key);
      if (built) return built;
    }
  }

  const rawUrl = value.videoUrl?.trim();
  if (!rawUrl) return null;

  if (isAbsoluteVideoUrl(rawUrl)) {
    return rawUrl;
  }

  if (isLegacyAppUploadUrl(rawUrl)) {
    const objectKey = extractObjectKeyFromLegacyUrl(rawUrl);
    if (objectKey?.startsWith("videos/")) {
      return buildPublicMediaUrl(objectKey);
    }
    return null;
  }

  const resolved = resolvePublicMediaUrl(rawUrl);
  if (resolved && !isLegacyAppUploadUrl(resolved)) {
    return resolved;
  }

  if (isPrivateR2Url(rawUrl)) return null;

  if (isUploadedVideoUrl(rawUrl)) return null;

  return rawUrl.startsWith("http") ? rawUrl : null;
}
