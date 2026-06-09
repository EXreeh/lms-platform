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

export function getActiveStorageProviderName(): "local" | "s3" | "r2" {
  return env.STORAGE_PROVIDER;
}

export function isCloudStorageProvider(): boolean {
  return env.STORAGE_PROVIDER === "r2" || env.STORAGE_PROVIDER === "s3";
}

export function getStorageProvider(): StorageProvider {
  if (storageInstance) return storageInstance;

  const provider = env.STORAGE_PROVIDER;

  switch (provider) {
    case "r2":
      storageInstance = new R2StorageProvider();
      console.log("Storage provider selected: r2");
      console.log(`R2_PUBLIC_URL: ${env.R2_PUBLIC_URL ?? "(unset)"}`);
      logStorageInit("r2", {
        bucket: env.R2_BUCKET,
        publicUrl: env.R2_PUBLIC_URL,
      });
      break;
    case "s3":
      storageInstance = new S3StorageProvider();
      logStorageInit("s3", { bucket: env.AWS_S3_BUCKET });
      break;
    case "local":
      storageInstance = new LocalStorageProvider(getUploadsBasePath(), env.STORAGE_PUBLIC_URL);
      console.log("Storage provider selected: local");
      logStorageInit("local", { publicUrl: env.STORAGE_PUBLIC_URL });
      break;
    default:
      throw new Error(`Unsupported STORAGE_PROVIDER: ${String(provider)}`);
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

/** Initialize storage provider at startup (logs selected provider). */
export function initializeStorageProvider(): StorageProvider {
  return getStorageProvider();
}
