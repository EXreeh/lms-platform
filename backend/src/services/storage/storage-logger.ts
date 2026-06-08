import type { UploadCategory } from "./types.js";

export function logStorageInit(provider: string, bucket?: string) {
  console.log("[storage] provider selected", {
    provider,
    ...(bucket ? { bucket } : {}),
  });
}

export function logUploadSuccess(params: {
  provider: string;
  bucket?: string;
  category: UploadCategory;
  storageKey: string;
  size: number;
  mimeType: string;
}) {
  console.log("[storage] upload success", {
    provider: params.provider,
    ...(params.bucket ? { bucket: params.bucket } : {}),
    category: params.category,
    objectKey: `${params.category}/${params.storageKey}`,
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
  storageKey: string;
  success: boolean;
}) {
  const line = params.success ? console.log : console.error;
  line("[storage] delete", {
    provider: params.provider,
    ...(params.bucket ? { bucket: params.bucket } : {}),
    category: params.category,
    objectKey: `${params.category}/${params.storageKey}`,
    success: params.success,
  });
}
