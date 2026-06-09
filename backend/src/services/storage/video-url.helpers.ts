import { env } from "../../config/env.js";
import { getCategoryFolderName } from "./upload-paths.js";
import type { UploadCategory } from "./types.js";

export function normalizeObjectStorageKey(
  storageKey: string,
  category: UploadCategory = "video",
): string {
  const folder = getCategoryFolderName(category);
  if (storageKey.startsWith(`${folder}/`)) return storageKey;
  if (storageKey.includes("/")) return storageKey;
  return `${folder}/${storageKey}`;
}

export function buildPublicObjectUrl(objectKey: string): string | null {
  const base = env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/${objectKey.replace(/^\//, "")}`;
}

/** Rewrite private R2 API URLs or wrong hosts to the public custom domain. */
export function fixR2AssetUrl(url: string): string {
  const base = env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!base || !url.trim()) return url;

  const trimmed = url.trim();
  if (trimmed.startsWith(base)) return trimmed;

  if (/\.r2\.cloudflarestorage\.com/i.test(trimmed)) {
    let objectKey = trimmed.replace(/^https?:\/\/[^/]+\//i, "");
    const bucket = env.R2_BUCKET?.trim();
    if (bucket && objectKey.startsWith(`${bucket}/`)) {
      objectKey = objectKey.slice(bucket.length + 1);
    }
    objectKey = objectKey.replace(/[?#].*$/, "");
    if (/^(videos|resources|thumbnails)\//i.test(objectKey)) {
      return `${base}/${objectKey}`;
    }
  }

  const assetMatch = trimmed.match(/\/((?:videos|resources|thumbnails)\/[^?#]+)/i);
  if (assetMatch) {
    return `${base}/${assetMatch[1]}`;
  }

  return trimmed;
}

export function resolveLessonVideoUrl(lesson: {
  videoUrl?: string | null;
  videoStorageProvider?: string | null;
  videoStorageKey?: string | null;
}): string | null {
  if (lesson.videoStorageProvider === "r2") {
    if (lesson.videoStorageKey) {
      const key = normalizeObjectStorageKey(lesson.videoStorageKey, "video");
      const publicUrl = buildPublicObjectUrl(key);
      if (publicUrl) return publicUrl;
    }
    if (lesson.videoUrl) {
      return fixR2AssetUrl(lesson.videoUrl);
    }
  }

  if (lesson.videoUrl && /\.r2\.cloudflarestorage\.com/i.test(lesson.videoUrl)) {
    return fixR2AssetUrl(lesson.videoUrl);
  }

  return lesson.videoUrl ?? null;
}

export function resolveResourceUrl(resource: {
  url: string;
  storageProvider?: string | null;
}): string {
  if (resource.storageProvider === "r2") {
    return fixR2AssetUrl(resource.url);
  }
  if (/\.r2\.cloudflarestorage\.com/i.test(resource.url)) {
    return fixR2AssetUrl(resource.url);
  }
  return resource.url;
}

export function resolveCourseThumbnailUrl(thumbnail: string | null | undefined): string | null {
  if (!thumbnail) return null;
  if (thumbnail.startsWith("/uploads/")) return thumbnail;
  if (/^https?:\/\//i.test(thumbnail)) return fixR2AssetUrl(thumbnail);
  return thumbnail;
}

export function resolveVideoFieldsForSave(input: {
  videoUrl?: string | null;
  videoStorageProvider?: string | null;
  videoStorageKey?: string | null;
}): {
  videoUrl: string | null;
  videoStorageKey: string | null;
} {
  let storageKey = input.videoStorageKey ?? null;
  if (storageKey && input.videoStorageProvider === "r2") {
    storageKey = normalizeObjectStorageKey(storageKey, "video");
  }

  let videoUrl = input.videoUrl ?? null;
  if (input.videoStorageProvider === "r2" && storageKey) {
    const publicUrl = buildPublicObjectUrl(storageKey);
    if (publicUrl) videoUrl = publicUrl;
  } else if (videoUrl) {
    videoUrl = fixR2AssetUrl(videoUrl);
  }

  return { videoUrl, videoStorageKey: storageKey };
}
