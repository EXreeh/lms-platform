-- Course lifecycle + soft delete

CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'PENDING_DELETE', 'DELETED');

ALTER TYPE "ActivityType" ADD VALUE 'COURSE_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE 'COURSE_SUBMITTED';
ALTER TYPE "ActivityType" ADD VALUE 'COURSE_APPROVED';
ALTER TYPE "ActivityType" ADD VALUE 'COURSE_REJECTED';
ALTER TYPE "ActivityType" ADD VALUE 'DELETE_REQUESTED';
ALTER TYPE "ActivityType" ADD VALUE 'DELETE_APPROVED';

ALTER TABLE "courses" ADD COLUMN "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "courses" ADD COLUMN "delete_status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE';

UPDATE "courses" SET "status" = 'ARCHIVED' WHERE "archived" = true;
UPDATE "courses" SET "status" = 'APPROVED' WHERE "published" = true AND "archived" = false;
UPDATE "courses" SET "status" = 'DRAFT' WHERE "published" = false AND "archived" = false;

ALTER TABLE "courses" DROP COLUMN "published";
ALTER TABLE "courses" DROP COLUMN "archived";

ALTER TABLE "modules" ADD COLUMN "delete_status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "lessons" ADD COLUMN "delete_status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "quizzes" ADD COLUMN "delete_status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE';

DROP INDEX IF EXISTS "courses_published_archived_category_level_idx";
CREATE INDEX "courses_status_delete_status_category_level_idx" ON "courses"("status", "delete_status", "category", "level");
