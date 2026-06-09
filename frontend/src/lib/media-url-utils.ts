const R2_PUBLIC_BASE = normalizePublicBaseUrl(
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://media.cognitiaxai.com",
);

export function normalizePublicBaseUrl(baseUrl: string): string {
  return baseUrl
    .trim()
    .replace(/\/$/, "")
    .replace(/\/(videos|resources|thumbnails)$/i, "");
}

export function normalizeObjectKey(objectKey: string): string {
  let key = objectKey.replace(/^\//, "");
  key = key.replace(/^videos\/videos\//i, "videos/");
  key = key.replace(/^resources\/resources\//i, "resources/");
  key = key.replace(/^thumbnails\/thumbnails\//i, "thumbnails/");
  return key;
}

export function buildPublicMediaUrl(objectKey: string): string {
  const key = normalizeObjectKey(objectKey);
  return `${R2_PUBLIC_BASE}/${key}`;
}

export function isPrivateR2Url(url: string): boolean {
  return /\.r2\.cloudflarestorage\.com/i.test(url);
}

export function isAbsoluteVideoUrl(url: string): boolean {
  return /^https?:\/\/[^/]+\/videos\/[^?#]+/i.test(url.trim());
}

export function isUploadedMediaUrl(url: string): boolean {
  if (!url.trim()) return false;
  if (url.startsWith("/uploads/")) return true;
  if (/^videos\//i.test(url)) return true;
  return /^https?:\/\//i.test(url) && /\/videos\//i.test(url);
}

/** Resolve a public custom-domain URL; never return the private R2 API endpoint. */
export function resolvePublicMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();

  if (isAbsoluteVideoUrl(trimmed)) {
    return trimmed;
  }

  if (/^videos\//i.test(trimmed)) {
    return buildPublicMediaUrl(trimmed);
  }

  if (trimmed.startsWith("/videos/")) {
    return `${R2_PUBLIC_BASE}${trimmed}`;
  }

  if (isPrivateR2Url(trimmed)) {
    let objectKey = trimmed.replace(/^https?:\/\/[^/]+\//i, "");
    objectKey = objectKey.replace(/[?#].*$/, "");
    if (/^videos\//i.test(objectKey)) {
      return buildPublicMediaUrl(objectKey);
    }
    return null;
  }

  if (trimmed.startsWith(R2_PUBLIC_BASE)) return trimmed;

  if (/^https?:\/\//i.test(trimmed) && /\/videos\//i.test(trimmed)) {
    return trimmed;
  }

  return null;
}
