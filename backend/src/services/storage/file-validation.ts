import type { UploadCategory } from "./types.js";
import {
  getUploadLimitBytes,
  tooLargeCodeForCategory,
  tooLargeMessageForCategory,
} from "./upload-config.js";

const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".sh",
  ".bat",
  ".cmd",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".php",
  ".html",
  ".htm",
  ".svg",
  ".msi",
  ".dll",
  ".app",
  ".dmg",
  ".scr",
  ".vbs",
  ".ps1",
]);

/** Browsers often send empty or generic MIME types for valid files. */
const GENERIC_MIME_TYPES = new Set([
  "",
  "application/octet-stream",
  "binary/octet-stream",
  "application/x-msdownload",
]);

const CATEGORY_RULES: Record<
  UploadCategory,
  { extensions: Set<string>; mimeTypes: Set<string> }
> = {
  video: {
    extensions: new Set([".mp4", ".mov", ".webm", ".mkv"]),
    mimeTypes: new Set([
      "video/mp4",
      "video/quicktime",
      "video/webm",
      "video/x-matroska",
      "video/x-msvideo",
      "video/x-mp4",
      "application/mp4",
    ]),
  },
  thumbnail: {
    extensions: new Set([".jpg", ".jpeg", ".png", ".webp"]),
    mimeTypes: new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]),
  },
  resource: {
    extensions: new Set([
      ".pdf",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
      ".zip",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
      ".txt",
    ]),
    mimeTypes: new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/zip",
      "application/x-zip-compressed",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "text/plain",
    ]),
  },
};

export type FileValidationResult =
  | { ok: true }
  | { ok: false; message: string; code: string };

export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

function isMimeAllowed(
  category: UploadCategory,
  ext: string,
  mimeType: string,
): boolean {
  const rules = CATEGORY_RULES[category];
  if (rules.mimeTypes.has(mimeType)) return true;
  if (!rules.extensions.has(ext)) return false;
  if (GENERIC_MIME_TYPES.has(mimeType)) return true;
  // Trust extension for video/thumbnail when browsers misreport MIME
  if (category === "video" || category === "thumbnail") return true;
  return false;
}

export function validateUploadedFile(
  file: Express.Multer.File,
  category: UploadCategory,
): FileValidationResult {
  const ext = getFileExtension(file.originalname);

  if (!ext || BLOCKED_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      message: "Unsupported file type. Executable files are not allowed.",
      code: "INVALID_FILE_TYPE",
    };
  }

  const rules = CATEGORY_RULES[category];
  if (!rules.extensions.has(ext)) {
    return {
      ok: false,
      message: `Unsupported file type. Allowed: ${[...rules.extensions].join(", ")}`,
      code: "INVALID_FILE_TYPE",
    };
  }

  if (!isMimeAllowed(category, ext, file.mimetype)) {
    return {
      ok: false,
      message: `Unsupported file type for ${category} upload (${file.mimetype || "unknown MIME"}).`,
      code: "INVALID_FILE_TYPE",
    };
  }

  const maxSize = getUploadLimitBytes(category);
  if (file.size > maxSize) {
    return {
      ok: false,
      message: tooLargeMessageForCategory(category, file.size),
      code: tooLargeCodeForCategory(category),
    };
  }

  return { ok: true };
}

export { formatBytes, getUploadLimitBytes } from "./upload-config.js";
