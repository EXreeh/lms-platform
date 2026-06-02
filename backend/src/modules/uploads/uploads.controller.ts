import type { Request, Response } from "express";
import { getStorageProvider } from "../../services/storage/index.js";
import type { UploadCategory } from "../../services/storage/types.js";
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

    console.log("[uploads] saved", {
      category,
      destination: req.file.destination,
      filename: req.file.filename,
      path: req.file.path,
      publicUrl: stored.url,
      size: stored.size,
      mimeType: stored.mimeType,
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: stored,
    });
  } catch (err) {
    console.error("[uploads] storage failure", {
      category,
      destination: req.file.destination,
      path: req.file.path,
      error: err instanceof Error ? err.message : err,
    });

    if (err instanceof ApiError) throw err;

    throw ApiError.internal("File upload failed. Please try again.", "STORAGE_FAILURE");
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
  if (!["video", "resource", "thumbnail"].includes(category)) {
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
