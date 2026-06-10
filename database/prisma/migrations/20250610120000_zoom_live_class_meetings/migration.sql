-- CreateEnum
CREATE TYPE "MeetingProvider" AS ENUM ('ZOOM', 'GOOGLE_MEET', 'CUSTOM');

-- AlterTable
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "meeting_provider" "MeetingProvider" NOT NULL DEFAULT 'ZOOM';
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "meeting_url" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "meeting_id" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "meeting_password" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "start_url" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "join_url" TEXT;

-- Migrate legacy live_url
UPDATE "live_classes"
SET
  "meeting_url" = COALESCE("meeting_url", "live_url"),
  "join_url" = COALESCE("join_url", "live_url")
WHERE "live_url" IS NOT NULL;

ALTER TABLE "live_classes" DROP COLUMN IF EXISTS "live_url";
