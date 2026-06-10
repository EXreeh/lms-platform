import {
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
  type S3ServiceException,
} from "@aws-sdk/client-s3";
import { ApiError } from "../../utils/api-error.js";
import { sanitizeDisplayName, sanitizeStoredFilename } from "./sanitize-filename.js";
import type { StorageProvider, StoredFile, UploadCategory } from "./types.js";
import { getCategoryFolderName } from "./upload-paths.js";
import { resolveVideoContentType } from "./content-type.js";
import { buildPublicMediaUrl, normalizePublicBaseUrl } from "./public-url.js";
import { logDelete, logUploadFailure, logUploadSuccess } from "./storage-logger.js";

export interface ObjectStorageConfig {
  provider: "r2" | "s3";
  bucket: string;
  publicBaseUrl: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function objectKey(category: UploadCategory, storageKey: string): string {
  return `${getCategoryFolderName(category)}/${storageKey}`;
}

function mapS3Error(err: unknown, provider: string, bucket: string): never {
  const name = err instanceof Error ? (err as S3ServiceException).name : undefined;
  const message = err instanceof Error ? err.message : "Unknown storage error";

  if (
    name === "InvalidAccessKeyId" ||
    name === "SignatureDoesNotMatch" ||
    name === "InvalidSignatureException" ||
    message.includes("credential")
  ) {
    throw ApiError.internal(
      `${provider.toUpperCase()} credentials are invalid. Check access keys in environment.`,
      "STORAGE_CREDENTIALS_ERROR",
    );
  }

  if (name === "NoSuchBucket" || message.includes("bucket does not exist")) {
    throw ApiError.internal(
      `${provider.toUpperCase()} bucket not found: ${bucket}`,
      "STORAGE_BUCKET_ERROR",
    );
  }

  if (name === "EntityTooLarge") {
    throw ApiError.badRequest("File is too large for upload.", "UPLOAD_TOO_LARGE");
  }

  throw ApiError.internal("File upload failed. Please try again.", "STORAGE_ERROR");
}

export class ObjectStorageProvider implements StorageProvider {
  private readonly client: S3Client;

  constructor(private readonly config: ObjectStorageConfig) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  get bucket() {
    return this.config.bucket;
  }

  get providerLabel() {
    return this.config.provider;
  }

  async verifyBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.config.bucket }));
    } catch (err) {
      mapS3Error(err, this.config.provider, this.config.bucket);
    }
  }

  getPublicUrl(storageKey: string, category: UploadCategory): string {
    const key = storageKey.includes("/")
      ? storageKey
      : objectKey(category, storageKey);
    const url = buildPublicMediaUrl(key, normalizePublicBaseUrl(this.config.publicBaseUrl));
    if (!url) {
      throw ApiError.internal(
        "R2_PUBLIC_URL is not configured. Cannot build public media URL.",
        "STORAGE_CONFIG_ERROR",
      );
    }
    return url;
  }

  async saveWithKey(
    file: Express.Multer.File,
    objectKeyPath: string,
    contentType?: string,
  ): Promise<StoredFile> {
    if (!file.buffer?.length) {
      throw ApiError.internal(
        "Cloud upload requires in-memory file buffer.",
        "STORAGE_ERROR",
      );
    }

    const resolvedType =
      contentType ??
      resolveVideoContentType(file.mimetype, file.originalname) ??
      (file.mimetype || "application/octet-stream");
    const publicUrl = buildPublicMediaUrl(
      objectKeyPath,
      normalizePublicBaseUrl(this.config.publicBaseUrl),
    );
    if (!publicUrl) {
      throw ApiError.internal("Cannot build public URL for recording", "STORAGE_CONFIG_ERROR");
    }

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: objectKeyPath,
          Body: file.buffer,
          ContentType: resolvedType,
          ContentLength: file.size,
        }),
      );

      return {
        url: publicUrl,
        publicUrl,
        fileName: sanitizeDisplayName(file.originalname),
        mimeType: resolvedType,
        size: file.size,
        fileSize: file.size,
        storageKey: objectKeyPath,
        storageProvider: this.config.provider,
      };
    } catch (err) {
      mapS3Error(err, this.config.provider, this.config.bucket);
    }
  }

  async save(file: Express.Multer.File, category: UploadCategory): Promise<StoredFile> {
    if (!file.buffer?.length) {
      throw ApiError.internal(
        "Cloud upload requires in-memory file buffer.",
        "STORAGE_ERROR",
      );
    }

    const fileName = file.filename ?? sanitizeStoredFilename(file.originalname);
    const objectKeyPath = objectKey(category, fileName);
    const publicUrl = this.getPublicUrl(objectKeyPath, category);
    const contentType =
      category === "video"
        ? resolveVideoContentType(file.mimetype, fileName)
        : file.mimetype || "application/octet-stream";

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: objectKeyPath,
          Body: file.buffer,
          ContentType: contentType,
          ContentLength: file.size,
        }),
      );

      const stored: StoredFile = {
        url: publicUrl,
        publicUrl,
        fileName: sanitizeDisplayName(file.originalname),
        mimeType: contentType,
        size: file.size,
        fileSize: file.size,
        storageKey: objectKeyPath,
        storageProvider: this.config.provider,
      };

      logUploadSuccess({
        provider: this.config.provider,
        bucket: this.config.bucket,
        category,
        objectKey: objectKeyPath,
        publicUrl,
        size: file.size,
        mimeType: contentType,
      });

      return stored;
    } catch (err) {
      logUploadFailure({
        provider: this.config.provider,
        bucket: this.config.bucket,
        category,
        error: err instanceof Error ? err.message : String(err),
        code: err instanceof Error ? (err as S3ServiceException).name : undefined,
      });
      mapS3Error(err, this.config.provider, this.config.bucket);
    }
  }

  async delete(storageKey: string, category: UploadCategory): Promise<void> {
    const key = storageKey.includes("/")
      ? storageKey
      : objectKey(category, storageKey);
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        }),
      );
      logDelete({
        provider: this.config.provider,
        bucket: this.config.bucket,
        category,
        objectKey: key,
        success: true,
      });
    } catch (err) {
      logDelete({
        provider: this.config.provider,
        bucket: this.config.bucket,
        category,
        objectKey: key,
        success: false,
      });
      mapS3Error(err, this.config.provider, this.config.bucket);
    }
  }
}
