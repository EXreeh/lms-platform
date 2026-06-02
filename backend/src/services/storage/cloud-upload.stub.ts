import type {
  CloudUploadProvider,
  CompleteMultipartUploadRequest,
  MultipartUploadInitRequest,
  PresignedUploadRequest,
  PresignedUploadResponse,
  MultipartUploadInitResponse,
} from "./cloud-upload.types.js";
import type { StoredFile } from "./types.js";

/**
 * Stub — replace with R2/S3 implementation when cloud storage is enabled.
 */
export class CloudUploadStub implements CloudUploadProvider {
  private notConfigured(): never {
    throw new Error(
      "Cloud upload is not configured. Set STORAGE_PROVIDER=r2 or s3 with credentials. " +
        "Local uploads (STORAGE_PROVIDER=local) are limited to small files.",
    );
  }

  async createPresignedUpload(_request: PresignedUploadRequest): Promise<PresignedUploadResponse> {
    this.notConfigured();
  }

  async initiateMultipartUpload(
    _request: MultipartUploadInitRequest,
  ): Promise<MultipartUploadInitResponse> {
    this.notConfigured();
  }

  async getPresignedPartUrl(
    _uploadId: string,
    _storageKey: string,
    _partNumber: number,
  ): Promise<string> {
    this.notConfigured();
  }

  async completeMultipartUpload(_request: CompleteMultipartUploadRequest): Promise<StoredFile> {
    this.notConfigured();
  }

  async abortMultipartUpload(_uploadId: string, _storageKey: string): Promise<void> {
    this.notConfigured();
  }
}
