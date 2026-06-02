import { randomUUID } from "node:crypto";
import { getFileExtension } from "./file-validation.js";

export function sanitizeStoredFilename(originalName: string): string {
  const ext = getFileExtension(originalName);
  return `${randomUUID()}${ext}`;
}

export function sanitizeDisplayName(originalName: string): string {
  return originalName.replace(/[^\w\s.\-()]/g, "_").slice(0, 200);
}
