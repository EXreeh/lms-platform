import type { StorageProvider, StoredFile, UploadCategory } from "./types.js";

/**
 * Cloudflare R2 storage — implement when STORAGE_PROVIDER=r2 and credentials are configured.
 *
 * TODO: Implement CloudUploadProvider (presigned + multipart) from cloud-upload.types.ts
 * for large video uploads. Local disk (STORAGE_PROVIDER=local) is dev/small files only.
 */
export class R2StorageProvider implements StorageProvider {
  constructor() {
    throw new Error(
      "R2 storage is not configured yet. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_PUBLIC_URL.",
    );
  }

  getPublicUrl(_storageKey: string, _category: UploadCategory): string {
    throw new Error("R2 storage not implemented");
  }

  async save(_file: Express.Multer.File, _category: UploadCategory): Promise<StoredFile> {
    throw new Error("R2 storage not implemented");
  }

  async delete(_storageKey: string, _category: UploadCategory): Promise<void> {
    throw new Error("R2 storage not implemented");
  }
}
