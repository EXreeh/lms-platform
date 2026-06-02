import multer from "multer";
import { mkdirSync } from "node:fs";
import type { Request, Response, NextFunction } from "express";
import type { UploadCategory } from "../../services/storage/types.js";
import {
  getUploadLimitBytes,
  tooLargeCodeForCategory,
  tooLargeLimitMessage,
} from "../../services/storage/upload-config.js";
import { validateUploadedFile } from "../../services/storage/file-validation.js";
import { getCategoryDir } from "../../services/storage/upload-paths.js";
import { sanitizeStoredFilename } from "../../services/storage/sanitize-filename.js";
import { ApiError } from "../../utils/api-error.js";

function ensureDestinationDir(category: UploadCategory): string {
  const dir = getCategoryDir(category);
  try {
    mkdirSync(dir, { recursive: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to prepare upload folder";
    throw ApiError.internal(`Upload folder unavailable: ${message}`, "STORAGE_ERROR");
  }
  return dir;
}

function createUploader(category: UploadCategory) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      try {
        const dir = ensureDestinationDir(category);
        cb(null, dir);
      } catch (err) {
        cb(err as Error, "");
      }
    },
    filename: (_req, file, cb) => {
      cb(null, sanitizeStoredFilename(file.originalname));
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: getUploadLimitBytes(category), files: 1 },
    fileFilter: (_req, file, cb) => {
      const ext = file.originalname.includes(".")
        ? file.originalname.slice(file.originalname.lastIndexOf(".")).toLowerCase()
        : "";
      const fakeFile = {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: 0,
      } as Express.Multer.File;
      const result = validateUploadedFile(fakeFile, category);
      if (!result.ok && !ext) {
        cb(new Error(result.message));
        return;
      }
      if (!result.ok && category === "video") {
        const allowed = [".mp4", ".mov", ".webm", ".mkv"];
        if (!allowed.includes(ext)) {
          cb(new Error(result.message));
          return;
        }
      }
      cb(null, true);
    },
  });

  return upload.single("file");
}

export const uploadVideoMiddleware = createUploader("video");
export const uploadResourceMiddleware = createUploader("resource");
export const uploadThumbnailMiddleware = createUploader("thumbnail");

export function validateUploadedFileMiddleware(category: UploadCategory) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.file) {
      next(ApiError.badRequest("No file uploaded. Please select a file.", "NO_FILE"));
      return;
    }
    const result = validateUploadedFile(req.file, category);
    if (!result.ok) {
      next(ApiError.badRequest(result.message, result.code));
      return;
    }
    next();
  };
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}

export function handleMulterErrorForCategory(category: UploadCategory) {
  return (err: unknown, _req: Request, _res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(
          ApiError.badRequest(tooLargeLimitMessage(category), tooLargeCodeForCategory(category)),
        );
        return;
      }
      next(ApiError.badRequest(err.message, "UPLOAD_ERROR"));
      return;
    }

    if (isNodeError(err)) {
      if (err.code === "ENOENT") {
        next(
          ApiError.internal(
            "Upload storage folder is missing or unavailable.",
            "STORAGE_ERROR",
          ),
        );
        return;
      }
      if (err.code === "EACCES" || err.code === "EPERM") {
        next(ApiError.internal("Upload storage permission denied.", "STORAGE_ERROR"));
        return;
      }
    }

    if (err instanceof ApiError) {
      next(err);
      return;
    }

    if (err instanceof Error) {
      if (err.message.includes("Unsupported") || err.message.includes("Allowed:")) {
        next(ApiError.badRequest(err.message, "INVALID_FILE_TYPE"));
        return;
      }
      if (err.message.includes("Upload folder unavailable")) {
        next(ApiError.internal(err.message, "STORAGE_ERROR"));
        return;
      }
    }

    next(err);
  };
}

/** @deprecated Use handleMulterErrorForCategory */
export function handleMulterError(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  handleMulterErrorForCategory("resource")(err, req, res, next);
}
