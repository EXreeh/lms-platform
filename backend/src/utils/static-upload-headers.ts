import path from "node:path";
import type { Response } from "express";

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".txt": "text/plain; charset=utf-8",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
};

/** Served inline in the browser (preview / stream). */
const INLINE_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".txt",
  ".mp4",
  ".webm",
  ".mov",
  ".mkv",
]);

export function setUploadStaticHeaders(res: Response, filePath: string): void {
  res.set("Cross-Origin-Resource-Policy", "cross-origin");

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (mime) {
    res.set("Content-Type", mime);
  }

  if (INLINE_EXTENSIONS.has(ext)) {
    res.set("Content-Disposition", "inline");
  }
}
