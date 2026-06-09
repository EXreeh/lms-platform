import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import {
  buildPublicMediaUrl,
  extractObjectKeyFromLegacyUrl,
  isLegacyAppUploadUrl,
} from "./public-url.js";
import type { StoredFile } from "./types.js";

/** Ensure cloud uploads never return local /uploads paths. */
export function toPublicUploadResponse(stored: StoredFile): {
  url: string;
  publicUrl: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  size: number;
  storageProvider: string;
} {
  let publicUrl = stored.publicUrl || stored.url;
  let storageProvider = stored.storageProvider;
  let storageKey = stored.storageKey;

  if (env.STORAGE_PROVIDER === "r2" || env.STORAGE_PROVIDER === "s3") {
    if (storageProvider === "local" || isLegacyAppUploadUrl(publicUrl)) {
      const objectKey =
        storageKey.includes("/")
          ? storageKey
          : extractObjectKeyFromLegacyUrl(publicUrl);
      const rebuilt = objectKey ? buildPublicMediaUrl(objectKey) : null;

      console.error("[storage] cloud provider misconfiguration detected", {
        configuredProvider: env.STORAGE_PROVIDER,
        returnedProvider: storageProvider,
        returnedUrl: publicUrl,
        storageKey,
        rebuiltUrl: rebuilt,
      });

      if (!rebuilt) {
        throw ApiError.internal(
          `Upload returned a local path (${publicUrl}) but STORAGE_PROVIDER=${env.STORAGE_PROVIDER}. ` +
            "Check Railway env vars on the backend service.",
          "STORAGE_CONFIG_ERROR",
        );
      }

      publicUrl = rebuilt;
      storageProvider = env.STORAGE_PROVIDER;
    }

    if (!publicUrl.startsWith("http")) {
      throw ApiError.internal(
        `Upload must return a public HTTPS URL when STORAGE_PROVIDER=${env.STORAGE_PROVIDER}. Got: ${publicUrl}`,
        "STORAGE_CONFIG_ERROR",
      );
    }
  }

  return {
    url: publicUrl,
    publicUrl,
    storageKey,
    fileName: stored.fileName,
    mimeType: stored.mimeType,
    fileSize: stored.fileSize,
    size: stored.size,
    storageProvider,
  };
}
