import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import {
  buildPublicMediaUrl,
  extractObjectKeyFromLegacyUrl,
  getR2PublicBaseUrl,
  isAbsolutePublicMediaUrl,
  isLegacyAppUploadUrl,
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

function resolveBareObjectKey(value: string): string | null {
  if (!/^(videos|resources|thumbnails|recordings)\//i.test(value)) return null;
  return buildPublicObjectUrl(value);
}

/** Rewrite private R2 API URLs, legacy /uploads paths, or www app-domain upload URLs to R2 public domain. */
export function fixR2AssetUrl(url: string): string {
  const base = getR2PublicBaseUrl();
  if (!base || !url.trim()) return url;

  const trimmed = url.trim();

  if (isAbsolutePublicMediaUrl(trimmed) && trimmed.startsWith(base)) {
    return trimmed;
  }

  if (isLegacyAppUploadUrl(trimmed)) {
    const objectKey = extractObjectKeyFromLegacyUrl(trimmed);
    if (objectKey) {
      const rebuilt = buildPublicMediaUrl(objectKey, base);
      if (rebuilt) return rebuilt;
    }
  }

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
  const useR2 =
    lesson.videoStorageProvider === "r2" ||
    env.STORAGE_PROVIDER === "r2" ||
    Boolean(lesson.videoStorageKey);

  if (lesson.videoStorageKey) {
    const key = normalizeObjectStorageKey(lesson.videoStorageKey, "video");
    const publicUrl = buildPublicObjectUrl(key);
    if (publicUrl) return publicUrl;
  }

  if (lesson.videoUrl) {
    if (
      useR2 ||
      isLegacyAppUploadUrl(lesson.videoUrl) ||
      isPrivateR2Endpoint(lesson.videoUrl)
    ) {
      const fixed = fixR2AssetUrl(lesson.videoUrl);
      if (isLegacyAppUploadUrl(fixed)) return null;
      return fixed;
    }
    if (isLegacyAppUploadUrl(lesson.videoUrl)) return null;
    return lesson.videoUrl;
  }

  return null;
}

export function resolveResourceUrl(resource: {
  url: string;
  storageProvider?: string | null;
}): string {
  if (resource.storageProvider === "r2" || env.STORAGE_PROVIDER === "r2") {
    return fixR2AssetUrl(resource.url);
  }
  if (isLegacyAppUploadUrl(resource.url) || isPrivateR2Endpoint(resource.url)) {
    return fixR2AssetUrl(resource.url);
  }
  return resource.url;
}

export function resolveCourseThumbnailUrl(thumbnail: string | null | undefined): string | null {
  if (!thumbnail) return null;
  if (isLegacyAppUploadUrl(thumbnail) || env.STORAGE_PROVIDER === "r2") {
    return fixR2AssetUrl(thumbnail);
  }
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
  videoStorageProvider: string | null;
} {
  let storageKey = input.videoStorageKey ?? null;
  let videoUrl = input.videoUrl ?? null;
  let videoStorageProvider = input.videoStorageProvider ?? null;

  if (videoUrl && isLegacyAppUploadUrl(videoUrl)) {
    const extracted = extractObjectKeyFromLegacyUrl(videoUrl);
    if (extracted) {
      storageKey = storageKey ?? extracted;
      if (env.STORAGE_PROVIDER === "r2") {
        videoStorageProvider = "r2";
      }
    }
  }

  if (env.STORAGE_PROVIDER === "r2") {
    if (storageKey || isLegacyAppUploadUrl(videoUrl ?? "")) {
      videoStorageProvider = "r2";
    }
  }

  if (storageKey && videoStorageProvider === "r2") {
    storageKey = normalizeObjectKey(normalizeObjectStorageKey(storageKey, "video"));
  }

  if (videoStorageProvider === "r2" && storageKey) {
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

  if (env.STORAGE_PROVIDER === "r2" && videoUrl && isLegacyAppUploadUrl(videoUrl)) {
    if (storageKey) {
      const rebuilt = buildPublicObjectUrl(storageKey);
      if (rebuilt) {
        videoUrl = rebuilt;
      } else {
        throw ApiError.internal(
          "Cannot save legacy /uploads video path when STORAGE_PROVIDER=r2. Re-upload the video.",
          "STORAGE_CONFIG_ERROR",
        );
      }
    } else {
      throw ApiError.internal(
        "Cannot save legacy /uploads video path when STORAGE_PROVIDER=r2. Re-upload the video.",
        "STORAGE_CONFIG_ERROR",
      );
    }
  }

  if (env.STORAGE_PROVIDER === "r2" && videoUrl && !videoUrl.startsWith("http")) {
    const rebuilt = buildPublicObjectUrl(storageKey ?? videoUrl);
    if (rebuilt) videoUrl = rebuilt;
  }

  if (env.STORAGE_PROVIDER === "r2" && videoUrl?.startsWith("http") && isLegacyAppUploadUrl(videoUrl)) {
    videoUrl = fixR2AssetUrl(videoUrl);
    videoStorageProvider = "r2";
  }

  return { videoUrl, videoStorageKey: storageKey, videoStorageProvider };
}
