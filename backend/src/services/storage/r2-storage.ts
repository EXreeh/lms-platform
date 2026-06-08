import { env } from "../../config/env.js";
import { ObjectStorageProvider } from "./object-storage.js";

function requireR2Env(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`${name} is required when STORAGE_PROVIDER=r2`);
  }
  return value.trim();
}

/**
 * Cloudflare R2 storage via S3-compatible API.
 * Objects are stored as: {category}/{uuid}{ext} e.g. videos/abc.mp4
 */
export class R2StorageProvider extends ObjectStorageProvider {
  constructor() {
    const accountId = requireR2Env("R2_ACCOUNT_ID", env.R2_ACCOUNT_ID);
    const bucket = requireR2Env("R2_BUCKET", env.R2_BUCKET);
    const accessKeyId = requireR2Env("R2_ACCESS_KEY_ID", env.R2_ACCESS_KEY_ID);
    const secretAccessKey = requireR2Env("R2_SECRET_ACCESS_KEY", env.R2_SECRET_ACCESS_KEY);
    const publicBaseUrl = requireR2Env("R2_PUBLIC_URL", env.R2_PUBLIC_URL);

    const endpoint =
      env.R2_ENDPOINT?.trim() ||
      `https://${accountId}.r2.cloudflarestorage.com`;

    super({
      provider: "r2",
      bucket,
      publicBaseUrl,
      endpoint,
      region: "auto",
      accessKeyId,
      secretAccessKey,
    });
  }
}
