export type UploadCategory =
  | "video"
  | "resource"
  | "thumbnail"
  | "assignment"
  | "certificate";

export interface StoredFile {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  storageProvider: string;
}

export interface StorageProvider {
  save(file: Express.Multer.File, category: UploadCategory): Promise<StoredFile>;
  delete(storageKey: string, category: UploadCategory): Promise<void>;
  getPublicUrl(storageKey: string, category: UploadCategory): string;
}
