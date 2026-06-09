export type UploadCategory =
  | "video"
  | "resource"
  | "thumbnail"
  | "assignment"
  | "certificate";

export interface StoredFile {
  url: string;
  /** Public playable URL (same as url for cloud storage). */
  publicUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  /** Full object key, e.g. videos/uuid.mp4 for R2. */
  storageKey: string;
  storageProvider: string;
}

export interface StorageProvider {
  save(file: Express.Multer.File, category: UploadCategory): Promise<StoredFile>;
  delete(storageKey: string, category: UploadCategory): Promise<void>;
  getPublicUrl(storageKey: string, category: UploadCategory): string;
}
