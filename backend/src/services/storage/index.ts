import { env } from "../../config/env.js";
import { LocalStorageProvider } from "./local-storage.js";
import { S3StorageProvider } from "./s3-storage.js";
import { R2StorageProvider } from "./r2-storage.js";
import type { StorageProvider } from "./types.js";
import { getUploadsBasePath } from "./upload-paths.js";

export * from "./types.js";
export * from "./file-validation.js";
export * from "./upload-config.js";
export * from "./cloud-upload.types.js";
export { sanitizeDisplayName } from "./sanitize-filename.js";
export {
  ensureUploadDirectories,
  getUploadsBasePath,
  getCategoryDir,
  getCategoryFolderName,
} from "./upload-paths.js";

let storageInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (storageInstance) return storageInstance;

  const provider = env.STORAGE_PROVIDER;

  if (provider === "s3") {
    storageInstance = new S3StorageProvider();
  } else if (provider === "r2") {
    storageInstance = new R2StorageProvider();
  } else {
    storageInstance = new LocalStorageProvider(getUploadsBasePath(), env.STORAGE_PUBLIC_URL);
  }

  return storageInstance;
}
