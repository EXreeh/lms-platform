import { env } from "../../config/env.js";
import { LocalStorageProvider } from "./local-storage.js";
import { S3StorageProvider } from "./s3-storage.js";
import { R2StorageProvider } from "./r2-storage.js";
import type { StorageProvider } from "./types.js";
import { getUploadsBasePath } from "./upload-paths.js";
import { logStorageInit } from "./storage-logger.js";

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
    logStorageInit("s3");
  } else if (provider === "r2") {
    storageInstance = new R2StorageProvider();
    logStorageInit("r2", env.R2_BUCKET);
  } else {
    storageInstance = new LocalStorageProvider(getUploadsBasePath(), env.STORAGE_PUBLIC_URL);
    logStorageInit("local");
  }

  return storageInstance;
}

/** Verify remote bucket connectivity (R2/S3). No-op for local. */
export async function verifyStorageProvider(): Promise<void> {
  const provider = getStorageProvider();
  if ("verifyBucket" in provider && typeof provider.verifyBucket === "function") {
    await provider.verifyBucket();
  }
}
