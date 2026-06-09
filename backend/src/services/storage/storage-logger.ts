import type { UploadCategory } from "./types.js";

export function logStorageInit(
  provider: string,
  details?: { bucket?: string; publicUrl?: string },
) {
  console.log("[storage] provider selected", {
    provider,
    source: "STORAGE_PROVIDER env",
    ...(details?.bucket ? { bucket: details.bucket } : {}),
    ...(details?.publicUrl ? { publicUrl: details.publicUrl } : {}),
  });
}

export function logUploadSuccess(params: {
  provider: string;
  bucket?: string;
  category: UploadCategory;
  objectKey: string;
  publicUrl: string;
  size: number;
  mimeType: string;
}) {
  console.log("[storage] upload success", {
    provider: params.provider,
    ...(params.bucket ? { bucket: params.bucket } : {}),
    category: params.category,
    objectKey: params.objectKey,
    publicUrl: params.publicUrl,
    size: params.size,
    mimeType: params.mimeType,
  });
}

export function logUploadFailure(params: {
  provider: string;
  bucket?: string;
  category: UploadCategory;
  error: string;
  code?: string;
}) {
  console.error("[storage] upload failure", {
    provider: params.provider,
    ...(params.bucket ? { bucket: params.bucket } : {}),
    category: params.category,
    error: params.error,
    ...(params.code ? { code: params.code } : {}),
  });
}

export function logDelete(params: {
  provider: string;
  bucket?: string;
  category: UploadCategory;
  objectKey: string;
  success: boolean;
}) {
  const line = params.success ? console.log : console.error;
  line("[storage] delete", {
    provider: params.provider,
    ...(params.bucket ? { bucket: params.bucket } : {}),
    category: params.category,
    objectKey: params.objectKey,
    success: params.success,
  });
}
