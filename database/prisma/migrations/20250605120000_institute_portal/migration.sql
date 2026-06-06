-- Private institute portal: course access, batch courses, teacher salary

CREATE TYPE "AccessType" AS ENUM ('ADMIN_ASSIGNED', 'BATCH_ASSIGNED', 'FULL_FEE_PAID', 'TRIAL');
CREATE TYPE "SalaryStatus" AS ENUM ('PENDING', 'PAID', 'HOLD');

CREATE TABLE "batch_courses" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "batch_courses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "student_course_access" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "assigned_by_id" TEXT NOT NULL,
    "access_type" "AccessType" NOT NULL,
    "lifetime_access" BOOLEAN NOT NULL DEFAULT false,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_course_access_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teacher_salaries" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "base_salary" DECIMAL(12,2) NOT NULL,
    "bonus" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_salary" DECIMAL(12,2) NOT NULL,
    "status" "SalaryStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "teacher_salaries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "batch_courses_batch_id_course_id_key" ON "batch_courses"("batch_id", "course_id");
CREATE INDEX "batch_courses_course_id_idx" ON "batch_courses"("course_id");
ALTER TABLE "batch_courses" ADD CONSTRAINT "batch_courses_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "batch_courses" ADD CONSTRAINT "batch_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "student_course_access_student_id_course_id_key" ON "student_course_access"("student_id", "course_id");
CREATE INDEX "student_course_access_student_id_revoked_at_idx" ON "student_course_access"("student_id", "revoked_at");
CREATE INDEX "student_course_access_course_id_idx" ON "student_course_access"("course_id");
ALTER TABLE "student_course_access" ADD CONSTRAINT "student_course_access_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_course_access" ADD CONSTRAINT "student_course_access_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_course_access" ADD CONSTRAINT "student_course_access_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "teacher_salaries_teacher_id_month_year_key" ON "teacher_salaries"("teacher_id", "month", "year");
CREATE INDEX "teacher_salaries_status_year_month_idx" ON "teacher_salaries"("status", "year", "month");
ALTER TABLE "teacher_salaries" ADD CONSTRAINT "teacher_salaries_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill access from existing enrollments
INSERT INTO "student_course_access" ("id", "student_id", "course_id", "assigned_by_id", "access_type", "lifetime_access", "starts_at", "created_at")
SELECT
    gen_random_uuid()::text,
    e."student_id",
    e."course_id",
    c."teacher_id",
    'ADMIN_ASSIGNED'::"AccessType",
    false,
    e."enrolled_at",
    e."enrolled_at"
FROM "enrollments" e
JOIN "courses" c ON c."id" = e."course_id"
ON CONFLICT DO NOTHING;

-- Backfill batch courses from legacy single courseId on batches
INSERT INTO "batch_courses" ("id", "batch_id", "course_id", "created_at")
SELECT gen_random_uuid()::text, b."id", b."course_id", b."created_at"
FROM "batches" b
WHERE b."course_id" IS NOT NULL
ON CONFLICT DO NOTHING;
