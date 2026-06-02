-- AlterTable
ALTER TABLE "courses" ADD COLUMN "thumbnail_file_name" TEXT;

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "video_file_name" TEXT;
ALTER TABLE "lessons" ADD COLUMN "video_mime_type" TEXT;
ALTER TABLE "lessons" ADD COLUMN "video_size" INTEGER;

-- AlterTable
ALTER TABLE "resources" ADD COLUMN "mime_type" TEXT;
ALTER TABLE "resources" ADD COLUMN "file_size" INTEGER;
ALTER TABLE "resources" ADD COLUMN "storage_provider" TEXT NOT NULL DEFAULT 'local';
