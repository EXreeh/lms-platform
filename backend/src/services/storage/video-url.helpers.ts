import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import {
  buildPublicMediaUrl,
  getR2PublicBaseUrl,
  isAbsolutePublicMediaUrl,
  isPrivateR2Endpoint,
  normalizeObjectKey,
} from "./public-url.js";
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
  return buildPublicMediaUrl(objectKey);
}

function isBareObjectKey(value: string): boolean {
  return /^(videos|resources|thumbnails)\//i.test(value);
}

function resolveBareObjectKey(value: string): string | null {
  if (!isBareObjectKey(value)) return null;
  return buildPublicObjectUrl(value);
}

/** Rewrite private R2 API URLs or wrong hosts to the public custom domain. */
export function fixR2AssetUrl(url: string): string {
  const base = getR2PublicBaseUrl();
  if (!base || !url.trim()) return url;

  const trimmed = url.trim();
  if (isAbsolutePublicMediaUrl(trimmed) && trimmed.startsWith(base)) return trimmed;

  if (isPrivateR2Endpoint(trimmed)) {
    let objectKey = trimmed.replace(/^https?:\/\/[^/]+\//i, "");
    const bucket = env.R2_BUCKET?.trim();
    if (bucket && objectKey.startsWith(`${bucket}/`)) {
      objectKey = objectKey.slice(bucket.length + 1);
    }
    objectKey = objectKey.replace(/[?#].*$/, "");
    const rebuilt = buildPublicMediaUrl(objectKey, base);
    if (rebuilt) return rebuilt;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    const bare = buildPublicMediaUrl(trimmed, base);
    if (bare) return bare;
  }

  const assetMatch = trimmed.match(/\/((?:videos|resources|thumbnails)\/[^?#]+)/i);
  if (assetMatch) {
    return buildPublicMediaUrl(assetMatch[1], base) ?? trimmed;
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

  if (lesson.videoUrl && isPrivateR2Endpoint(lesson.videoUrl)) {
    return fixR2AssetUrl(lesson.videoUrl);
  }

  if (lesson.videoUrl && isAbsolutePublicMediaUrl(lesson.videoUrl)) {
    return fixR2AssetUrl(lesson.videoUrl);
  }

  if (lesson.videoUrl && !/^https?:\/\//i.test(lesson.videoUrl)) {
    const bare = resolveBareObjectKey(lesson.videoUrl);
    if (bare) return bare;
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
    storageKey = normalizeObjectKey(normalizeObjectStorageKey(storageKey, "video"));
  }

  let videoUrl = input.videoUrl ?? null;
  if (input.videoStorageProvider === "r2" && storageKey) {
    const publicUrl = buildPublicObjectUrl(storageKey);
    if (publicUrl) {
      videoUrl = publicUrl;
    } else {
      console.error("[lessons] failed to build public video URL", {
        storageKey,
        r2PublicUrl: getR2PublicBaseUrl(),
      });
    }
  } else if (videoUrl && !/^https?:\/\//i.test(videoUrl)) {
    const bare = resolveBareObjectKey(videoUrl);
    if (bare) videoUrl = bare;
  } else if (videoUrl) {
    videoUrl = fixR2AssetUrl(videoUrl);
  }

  if (env.STORAGE_PROVIDER === "r2" && videoUrl?.startsWith("/uploads/")) {
    if (storageKey) {
      const rebuilt = buildPublicObjectUrl(storageKey);
      if (rebuilt) {
        videoUrl = rebuilt;
      } else {
        throw ApiError.internal(
          "Cannot save local /uploads video path when STORAGE_PROVIDER=r2. Re-upload the video.",
          "STORAGE_CONFIG_ERROR",
        );
      }
    } else {
      throw ApiError.internal(
        "Cannot save local /uploads video path when STORAGE_PROVIDER=r2. Re-upload the video.",
        "STORAGE_CONFIG_ERROR",
      );
    }
  }

  if (env.STORAGE_PROVIDER === "r2" && videoUrl && !videoUrl.startsWith("http")) {
    const rebuilt = buildPublicObjectUrl(storageKey ?? videoUrl);
    if (rebuilt) videoUrl = rebuilt;
  }

  return { videoUrl, videoStorageKey: storageKey };
}
