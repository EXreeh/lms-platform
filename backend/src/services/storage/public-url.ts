import { env } from "../../config/env.js";

/** Strip trailing category folders so base is the domain root only. */
export function normalizePublicBaseUrl(baseUrl: string): string {
  return baseUrl
    .trim()
    .replace(/\/$/, "")
    .replace(/\/(videos|resources|thumbnails)$/i, "");
}

export function getR2PublicBaseUrl(): string | null {
  const raw = env.R2_PUBLIC_URL?.trim();
  if (!raw) return null;
  return normalizePublicBaseUrl(raw);
}

export function normalizeObjectKey(objectKey: string): string {
  let key = objectKey.replace(/^\//, "");
  key = key.replace(/^videos\/videos\//i, "videos/");
  key = key.replace(/^resources\/resources\//i, "resources/");
  key = key.replace(/^thumbnails\/thumbnails\//i, "thumbnails/");
  return key;
}

/** Build https://media.cognitiaxai.com/videos/filename.mp4 from object key. */
export function buildPublicMediaUrl(objectKey: string, baseUrl?: string): string | null {
  const base = normalizePublicBaseUrl(baseUrl ?? getR2PublicBaseUrl() ?? "");
  if (!base) return null;

  const key = normalizeObjectKey(objectKey);
  if (!/^(videos|resources|thumbnails)\//i.test(key)) return null;

  return `${base}/${key}`;
}

export function isAbsolutePublicMediaUrl(url: string): boolean {
  return /^https?:\/\/[^/]+\/(videos|resources|thumbnails)\/[^?#]+/i.test(url.trim());
}

export function isPrivateR2Endpoint(url: string): boolean {
  return /\.r2\.cloudflarestorage\.com/i.test(url);
}
