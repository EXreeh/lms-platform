-- Rename enrollment progress column
ALTER TABLE "enrollments" RENAME COLUMN "progress" TO "progress_percentage";

-- Add completed flag, drop last_lesson_id (derived from lesson_progress)
ALTER TABLE "enrollments" ADD COLUMN "completed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "enrollments" DROP COLUMN IF EXISTS "last_lesson_id";

-- Lesson-level progress tracking
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "watched_duration" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lesson_progress_student_id_lesson_id_key" ON "lesson_progress"("student_id", "lesson_id");
CREATE INDEX "lesson_progress_student_id_idx" ON "lesson_progress"("student_id");

ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
