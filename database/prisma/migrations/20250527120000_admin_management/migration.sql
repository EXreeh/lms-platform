-- Admin management: user suspension, course archive, activity logs

CREATE TYPE "ActivityType" AS ENUM (
  'LOGIN',
  'COURSE_CREATED',
  'COURSE_PUBLISHED',
  'COURSE_ARCHIVED',
  'ENROLLMENT',
  'QUIZ_ATTEMPT',
  'USER_ROLE_CHANGED',
  'USER_SUSPENDED',
  'USER_CREATED'
);

ALTER TABLE "users" ADD COLUMN "suspended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "last_login_at" TIMESTAMP(3);

ALTER TABLE "courses" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "activity_logs" (
  "id" TEXT NOT NULL,
  "type" "ActivityType" NOT NULL,
  "user_id" TEXT,
  "course_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activity_logs_type_created_at_idx" ON "activity_logs"("type", "created_at");
CREATE INDEX "activity_logs_user_id_created_at_idx" ON "activity_logs"("user_id", "created_at");
CREATE INDEX "users_role_suspended_idx" ON "users"("role", "suspended");
CREATE INDEX "courses_published_archived_category_level_idx" ON "courses"("published", "archived", "category", "level");

ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_course_id_fkey"
  FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
