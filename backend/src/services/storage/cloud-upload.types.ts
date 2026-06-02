import type { StoredFile, UploadCategory } from "./types.js";

/**
 * Cloud upload architecture (R2 / S3-compatible).
 *
 * TODO: Implement when STORAGE_PROVIDER is `r2` or `s3`.
 * Local disk uploads are for development and small files only.
 * Production large videos should use presigned URLs + multipart upload.
 */

export interface PresignedUploadRequest {
  category: UploadCategory;
  fileName: string;
  mimeType: string;
  size: number;
  userId: string;
}

export interface PresignedUploadResponse {
  /** PUT or POST target URL */
  uploadUrl: string;
  /** Optional form fields for POST policy uploads */
  fields?: Record<string, string>;
  storageKey: string;
  publicUrl: string;
  expiresInSeconds: number;
}

export interface MultipartUploadInitRequest extends PresignedUploadRequest {}

export interface MultipartUploadInitResponse {
  uploadId: string;
  storageKey: string;
  /** Recommended part size in bytes (e.g. 10 MB) */
  partSize: number;
  publicUrl: string;
}

export interface MultipartUploadPart {
  partNumber: number;
  etag: string;
}

export interface CompleteMultipartUploadRequest {
  uploadId: string;
  storageKey: string;
  category: UploadCategory;
  parts: MultipartUploadPart[];
  fileName: string;
  mimeType: string;
  size: number;
}

/**
 * Large-file upload provider for Cloudflare R2 / AWS S3.
 * Not active while STORAGE_PROVIDER=local.
 */
export interface CloudUploadProvider {
  createPresignedUpload(request: PresignedUploadRequest): Promise<PresignedUploadResponse>;
  initiateMultipartUpload(
    request: MultipartUploadInitRequest,
  ): Promise<MultipartUploadInitResponse>;
  getPresignedPartUrl(
    uploadId: string,
    storageKey: string,
    partNumber: number,
  ): Promise<string>;
  completeMultipartUpload(request: CompleteMultipartUploadRequest): Promise<StoredFile>;
  abortMultipartUpload(uploadId: string, storageKey: string): Promise<void>;
}
