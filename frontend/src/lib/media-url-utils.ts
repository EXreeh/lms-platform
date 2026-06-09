const R2_PUBLIC_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, "");

export function isPrivateR2Url(url: string): boolean {
  return /\.r2\.cloudflarestorage\.com/i.test(url);
}

export function isUploadedMediaUrl(url: string): boolean {
  if (!url.trim()) return false;
  if (url.startsWith("/uploads/")) return true;
  return /^https?:\/\//i.test(url) && /\/(videos|resources|thumbnails)\//i.test(url);
}

/** Resolve a public custom-domain URL; never return the private R2 API endpoint. */
export function resolvePublicMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();
  if (R2_PUBLIC_BASE && trimmed.startsWith(R2_PUBLIC_BASE)) return trimmed;

  if (isPrivateR2Url(trimmed) && R2_PUBLIC_BASE) {
    let objectKey = trimmed.replace(/^https?:\/\/[^/]+\//i, "");
    objectKey = objectKey.replace(/[?#].*$/, "");
    const assetMatch = objectKey.match(/^((?:videos|resources|thumbnails)\/.+)$/i);
    if (assetMatch) return `${R2_PUBLIC_BASE}/${assetMatch[1]}`;
  }

  const pathMatch = trimmed.match(/\/((?:videos|resources|thumbnails)\/[^?#]+)/i);
  if (pathMatch && R2_PUBLIC_BASE) {
    return `${R2_PUBLIC_BASE}/${pathMatch[1]}`;
  }

  if (isPrivateR2Url(trimmed)) return null;

  return trimmed;
}
