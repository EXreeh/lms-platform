import type { StorageProvider, StoredFile, UploadCategory } from "./types.js";

/**
 * AWS S3 storage — implement when STORAGE_PROVIDER=s3 and credentials are configured.
 *
 * TODO: Implement CloudUploadProvider (presigned + multipart) from cloud-upload.types.ts
 * for large video uploads. Local disk (STORAGE_PROVIDER=local) is dev/small files only.
 */
export class S3StorageProvider implements StorageProvider {
  constructor() {
    throw new Error(
      "S3 storage is not configured yet. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_S3_BUCKET.",
    );
  }

  getPublicUrl(_storageKey: string, _category: UploadCategory): string {
    throw new Error("S3 storage not implemented");
  }

  async save(_file: Express.Multer.File, _category: UploadCategory): Promise<StoredFile> {
    throw new Error("S3 storage not implemented");
  }

  async delete(_storageKey: string, _category: UploadCategory): Promise<void> {
    throw new Error("S3 storage not implemented");
  }
}
