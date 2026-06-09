/**
 * One-time repair: convert legacy lesson video URLs to R2 public URLs.
 *
 * Usage (from backend workspace):
 *   npm run repair:r2-videos
 *
 * Repairs lessons where videoUrl is:
 * - /uploads/videos/filename.mp4
 * - https://www.cognitiaxai.com/uploads/videos/filename.mp4
 * and videoStorageKey exists (or can be extracted from the URL).
 */
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import {
  buildPublicMediaUrl,
  extractObjectKeyFromLegacyUrl,
  isLegacyAppUploadUrl,
  normalizeObjectKey,
} from "../services/storage/public-url.js";

async function main() {
  if (env.STORAGE_PROVIDER !== "r2") {
    console.error("STORAGE_PROVIDER must be r2. Current:", env.STORAGE_PROVIDER);
    process.exit(1);
  }

  const base = env.R2_PUBLIC_URL;
  if (!base) {
    console.error("R2_PUBLIC_URL is not set.");
    process.exit(1);
  }

  console.log("Repairing lesson video URLs...");
  console.log(`R2_PUBLIC_URL: ${base}`);

  const lessons = await prisma.lesson.findMany({
    where: {
      videoUrl: { not: null },
    },
    select: {
      id: true,
      title: true,
      videoUrl: true,
      videoStorageKey: true,
      videoStorageProvider: true,
    },
  });

  let repaired = 0;
  let skipped = 0;

  for (const lesson of lessons) {
    const videoUrl = lesson.videoUrl?.trim();
    if (!videoUrl || !isLegacyAppUploadUrl(videoUrl)) {
      skipped++;
      continue;
    }

    let storageKey =
      lesson.videoStorageKey ??
      extractObjectKeyFromLegacyUrl(videoUrl);

    if (!storageKey) {
      console.warn(`[skip] ${lesson.id} — cannot extract storage key from ${videoUrl}`);
      skipped++;
      continue;
    }

    storageKey = normalizeObjectKey(storageKey);
    const publicUrl = buildPublicMediaUrl(storageKey);
    if (!publicUrl) {
      console.warn(`[skip] ${lesson.id} — cannot build public URL for ${storageKey}`);
      skipped++;
      continue;
    }

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        videoUrl: publicUrl,
        videoStorageKey: storageKey,
        videoStorageProvider: "r2",
      },
    });

    console.log(`[fixed] ${lesson.id} "${lesson.title}"`);
    console.log(`  ${videoUrl}`);
    console.log(`  -> ${publicUrl}`);
    repaired++;
  }

  console.log(`Done. Repaired: ${repaired}, skipped: ${skipped}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
