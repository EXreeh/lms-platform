import { ApiError } from "../../utils/api-error.js";
import { sanitizeDisplayName, sanitizeStoredFilename } from "./sanitize-filename.js";
import { buildPublicMediaUrl } from "./public-url.js";
import { getStorageProvider } from "./index.js";
import type { StoredFile } from "./types.js";
import { resolveVideoContentType } from "./content-type.js";
import { ObjectStorageProvider } from "./object-storage.js";
import { LocalStorageProvider } from "./local-storage.js";

function recordingObjectKey(batchId: string, liveClassId: string, fileName: string): string {
  return `recordings/${batchId}/${liveClassId}/${fileName}`;
}

export async function saveLiveClassRecording(
  file: Express.Multer.File,
  batchId: string,
  liveClassId: string,
): Promise<StoredFile> {
  if (!file.buffer?.length && !file.path) {
    throw ApiError.badRequest("No recording file uploaded", "NO_FILE");
  }

  const fileName = file.filename ?? sanitizeStoredFilename(file.originalname);
  const storageKey = recordingObjectKey(batchId, liveClassId, fileName);
  const contentType = resolveVideoContentType(file.mimetype, fileName);
  const provider = getStorageProvider();

  if (provider instanceof ObjectStorageProvider) {
    const publicUrl = buildPublicMediaUrl(storageKey);
    if (!publicUrl) {
      throw ApiError.internal("R2_PUBLIC_URL is not configured", "STORAGE_CONFIG_ERROR");
    }

    const stored = await provider.saveWithKey(file, storageKey, contentType);
    return {
      ...stored,
      url: publicUrl,
      publicUrl,
      storageKey,
      storageProvider: stored.storageProvider,
    };
  }

  if (provider instanceof LocalStorageProvider) {
    const stored = await provider.save(file, "video");
    const publicUrl = buildPublicMediaUrl(storageKey) ?? stored.publicUrl;
    return {
      ...stored,
      url: publicUrl,
      publicUrl,
      storageKey,
    };
  }

  const stored = await provider.save(file, "video");
  return { ...stored, storageKey, publicUrl: stored.publicUrl };
}

export function buildRecordingPublicUrl(batchId: string, liveClassId: string, fileName: string): string {
  const key = recordingObjectKey(batchId, liveClassId, fileName);
  const url = buildPublicMediaUrl(key);
  if (!url) {
    throw ApiError.internal("Cannot build recording public URL", "STORAGE_CONFIG_ERROR");
  }
  return url;
}

export function mapRecordingStoredFile(stored: StoredFile) {
  return {
    url: stored.publicUrl || stored.url,
    publicUrl: stored.publicUrl || stored.url,
    storageKey: stored.storageKey,
    storageProvider: stored.storageProvider,
    fileName: sanitizeDisplayName(stored.fileName),
    mimeType: stored.mimeType,
    fileSize: stored.fileSize,
    size: stored.size,
  };
}
