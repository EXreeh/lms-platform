import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { getStorageProvider } from "../../services/storage/index.js";
import type { UploadCategory } from "../../services/storage/types.js";
import { logUploadFailure } from "../../services/storage/storage-logger.js";
import { ApiError } from "../../utils/api-error.js";

function requireTeacherOrAdmin(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.role !== "TEACHER" && req.user.role !== "ADMIN") {
    throw ApiError.forbidden("Only teachers and admins can upload files");
  }
}

async function handleUpload(req: Request, res: Response, category: UploadCategory) {
  requireTeacherOrAdmin(req);
  if (!req.file) throw ApiError.badRequest("No file uploaded", "NO_FILE");

  const storage = getStorageProvider();

  try {
    const stored = await storage.save(req.file, category);

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: stored,
    });
  } catch (err) {
    logUploadFailure({
      provider: env.STORAGE_PROVIDER,
      bucket: env.STORAGE_PROVIDER === "r2" ? env.R2_BUCKET : undefined,
      category,
      error: err instanceof Error ? err.message : String(err),
      code: err instanceof ApiError ? err.code : undefined,
    });

    if (err instanceof ApiError) throw err;

    throw ApiError.internal("File upload failed. Please try again.", "STORAGE_ERROR");
  }
}

export async function uploadVideo(req: Request, res: Response): Promise<void> {
  await handleUpload(req, res, "video");
}

export async function uploadResource(req: Request, res: Response): Promise<void> {
  await handleUpload(req, res, "resource");
}

export async function uploadThumbnail(req: Request, res: Response): Promise<void> {
  await handleUpload(req, res, "thumbnail");
}

export async function deleteUploadedFile(req: Request, res: Response): Promise<void> {
  if (!req.user || req.user.role !== "ADMIN") {
    throw ApiError.forbidden("Admin access required");
  }

  const category = req.params.category as UploadCategory;
  if (!["video", "resource", "thumbnail", "assignment", "certificate"].includes(category)) {
    throw ApiError.badRequest("Invalid upload category");
  }

  const filename = req.params.filename;
  if (!filename || filename.includes("..") || filename.includes("/")) {
    throw ApiError.badRequest("Invalid filename");
  }

  const storage = getStorageProvider();
  await storage.delete(filename, category);

  res.json({ success: true, message: "File deleted" });
}
