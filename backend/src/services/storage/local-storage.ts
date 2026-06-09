import { access, unlink } from "node:fs/promises";
import { join } from "node:path";
import type { StorageProvider, StoredFile, UploadCategory } from "./types.js";
import { sanitizeDisplayName } from "./sanitize-filename.js";
import {
  getCategoryDir,
  getCategoryFolderName,
  getUploadsBasePath,
} from "./upload-paths.js";

export class LocalStorageProvider implements StorageProvider {
  constructor(
    private readonly baseDir: string = getUploadsBasePath(),
    private readonly publicBaseUrl: string,
  ) {}

  private categoryDir(category: UploadCategory): string {
    return join(this.baseDir, getCategoryFolderName(category));
  }

  getPublicUrl(storageKey: string, category: UploadCategory): string {
    const folder = getCategoryFolderName(category);
    return `${this.publicBaseUrl}/${folder}/${storageKey}`;
  }

  async save(file: Express.Multer.File, category: UploadCategory): Promise<StoredFile> {
    if (!file.path || !file.filename) {
      throw new Error("Local upload requires multer disk storage with a saved file path");
    }

    const expectedDir = getCategoryDir(category);
    const storageKey = file.filename;

    try {
      await access(file.path);
    } catch {
      throw new Error(`Upload file not found at ${file.path}`);
    }

    if (!file.path.startsWith(expectedDir)) {
      throw new Error(
        `Upload file path mismatch: expected under ${expectedDir}, got ${file.path}`,
      );
    }

    const url = this.getPublicUrl(storageKey, category);

    return {
      url,
      publicUrl: url,
      fileName: sanitizeDisplayName(file.originalname),
      mimeType: file.mimetype,
      size: file.size,
      storageKey,
      storageProvider: "local",
    };
  }

  async delete(storageKey: string, category: UploadCategory): Promise<void> {
    const filePath = join(this.categoryDir(category), storageKey);
    try {
      await unlink(filePath);
    } catch {
      // file may already be removed
    }
  }
}
