import { mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../../config/env.js";
import type { UploadCategory } from "./types.js";

const CATEGORY_DIRS: Record<UploadCategory, string> = {
  video: "videos",
  resource: "resources",
  thumbnail: "thumbnails",
};

/** Resolve backend package root (stable regardless of process.cwd()). */
function getBackendRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
}

export function getUploadsBasePath(): string {
  if (env.UPLOADS_DIR.startsWith("/")) {
    return env.UPLOADS_DIR;
  }
  return resolve(getBackendRoot(), env.UPLOADS_DIR);
}

export function getCategoryDir(category: UploadCategory): string {
  return join(getUploadsBasePath(), CATEGORY_DIRS[category]);
}

export function getCategoryFolderName(category: UploadCategory): string {
  return CATEGORY_DIRS[category];
}

export async function ensureUploadDirectories(): Promise<void> {
  const base = getUploadsBasePath();

  await mkdir(base, { recursive: true });
  for (const category of Object.keys(CATEGORY_DIRS) as UploadCategory[]) {
    await mkdir(getCategoryDir(category), { recursive: true });
  }

  console.log("[uploads] Local storage directories ready:", {
    base,
    thumbnails: getCategoryDir("thumbnail"),
    videos: getCategoryDir("video"),
    resources: getCategoryDir("resource"),
  });
}
