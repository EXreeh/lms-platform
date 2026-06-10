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
  if (!/^(videos|resources|thumbnails|recordings)\//i.test(key)) return null;

  return `${base}/${key}`;
}

export function isAbsolutePublicMediaUrl(url: string): boolean {
  return /^https?:\/\/[^/]+\/(videos|resources|thumbnails)\/[^?#]+/i.test(url.trim());
}

export function isPrivateR2Endpoint(url: string): boolean {
  return /\.r2\.cloudflarestorage\.com/i.test(url);
}

/** Local disk path or app-domain proxy path, e.g. /uploads/videos/x.mp4 or https://www.example.com/uploads/videos/x.mp4 */
export function isLegacyAppUploadUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith("/uploads/") ||
    trimmed.startsWith("uploads/") ||
    /\/uploads\/(videos|resources|thumbnails)\//i.test(trimmed) ||
    /^https?:\/\/(www\.)?cognitiaxai\.com\/uploads\//i.test(trimmed)
  );
}

export function extractObjectKeyFromLegacyUrl(url: string): string | null {
  const match = url.trim().match(/\/(videos|resources|thumbnails)\/([^?#]+)/i);
  if (!match) return null;
  return normalizeObjectKey(`${match[1]}/${match[2]}`);
}
