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

/** True when URL is already on the R2 media domain (not app /uploads proxy). */
export function isAbsoluteVideoUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  if (isLegacyAppUploadUrl(trimmed)) return false;
  return trimmed.startsWith(`${R2_PUBLIC_BASE}/videos/`);
}

export function isUploadedMediaUrl(url: string): boolean {
  if (!url.trim()) return false;
  if (isLegacyAppUploadUrl(url)) return true;
  return /^https?:\/\//i.test(url) && /\/videos\//i.test(url);
}

/** Resolve a public custom-domain URL; never return legacy app /uploads paths. */
export function resolvePublicMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();

  if (isAbsoluteVideoUrl(trimmed)) {
    return trimmed;
  }

  if (isLegacyAppUploadUrl(trimmed)) {
    const objectKey = extractObjectKeyFromLegacyUrl(trimmed);
    if (objectKey?.startsWith("videos/")) {
      return buildPublicMediaUrl(objectKey);
    }
    return null;
  }

  if (/^videos\//i.test(trimmed)) {
    return buildPublicMediaUrl(trimmed);
  }

  if (trimmed.startsWith("/videos/")) {
    return `${R2_PUBLIC_BASE}${trimmed}`;
  }

  if (isPrivateR2Url(trimmed)) {
    const objectKey = extractObjectKeyFromLegacyUrl(trimmed);
    if (objectKey?.startsWith("videos/")) {
      return buildPublicMediaUrl(objectKey);
    }
    return null;
  }

  if (trimmed.startsWith(R2_PUBLIC_BASE)) return trimmed;

  return null;
}
