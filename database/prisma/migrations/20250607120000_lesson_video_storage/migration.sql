-- Lesson cloud storage metadata (R2 / S3)
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "video_storage_provider" TEXT;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "video_storage_key" TEXT;
