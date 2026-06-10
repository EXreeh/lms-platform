-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- AlterTable: live_classes — add course_id, live_url, updated_at
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "course_id" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "live_url" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill course_id from batch primary course
UPDATE "live_classes" lc
SET "course_id" = b."course_id"
FROM "batches" b
WHERE lc."batch_id" = b."id" AND lc."course_id" IS NULL AND b."course_id" IS NOT NULL;

-- Backfill from batch_courses when batch has no legacy course_id
UPDATE "live_classes" lc
SET "course_id" = bc."course_id"
FROM "batch_courses" bc
WHERE lc."batch_id" = bc."batch_id"
  AND lc."course_id" IS NULL
  AND bc."course_id" IS NOT NULL;

-- Copy meeting_url to live_url
UPDATE "live_classes" SET "live_url" = "meeting_url" WHERE "live_url" IS NULL AND "meeting_url" IS NOT NULL;

-- Make course_id required (delete orphan rows without course if any)
DELETE FROM "live_classes" WHERE "course_id" IS NULL;

ALTER TABLE "live_classes" ALTER COLUMN "course_id" SET NOT NULL;

-- Drop legacy meeting_url column
ALTER TABLE "live_classes" DROP COLUMN IF EXISTS "meeting_url";

-- AddForeignKey
ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_course_id_fkey"
  FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "live_class_recordings" (
    "id" TEXT NOT NULL,
    "live_class_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "video_url" TEXT NOT NULL,
    "video_storage_key" TEXT,
    "video_storage_provider" TEXT,
    "video_file_name" TEXT,
    "video_mime_type" TEXT,
    "video_size" INTEGER,
    "duration_seconds" INTEGER,
    "status" "RecordingStatus" NOT NULL DEFAULT 'ACTIVE',
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_class_recordings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "live_class_recordings_live_class_id_status_idx" ON "live_class_recordings"("live_class_id", "status");
CREATE INDEX "live_class_recordings_batch_id_status_idx" ON "live_class_recordings"("batch_id", "status");
CREATE INDEX "live_class_recordings_course_id_status_idx" ON "live_class_recordings"("course_id", "status");
CREATE INDEX "live_class_recordings_teacher_id_uploaded_at_idx" ON "live_class_recordings"("teacher_id", "uploaded_at");

ALTER TABLE "live_class_recordings" ADD CONSTRAINT "live_class_recordings_live_class_id_fkey"
  FOREIGN KEY ("live_class_id") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "live_class_recordings" ADD CONSTRAINT "live_class_recordings_batch_id_fkey"
  FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "live_class_recordings" ADD CONSTRAINT "live_class_recordings_course_id_fkey"
  FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "live_class_recordings" ADD CONSTRAINT "live_class_recordings_teacher_id_fkey"
  FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "live_classes_course_id_scheduled_at_idx" ON "live_classes"("course_id", "scheduled_at");
CREATE INDEX "live_classes_status_scheduled_at_idx" ON "live_classes"("status", "scheduled_at");
