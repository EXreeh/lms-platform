-- Course resources + certificates

CREATE TYPE "ResourceType" AS ENUM ('PDF', 'NOTE', 'LINK', 'ASSIGNMENT', 'OTHER');

ALTER TYPE "ActivityType" ADD VALUE 'RESOURCE_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'RESOURCE_REMOVED';
ALTER TYPE "ActivityType" ADD VALUE 'CERTIFICATE_ISSUED';

CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ResourceType" NOT NULL,
    "url" TEXT NOT NULL,
    "file_name" TEXT,
    "course_id" TEXT NOT NULL,
    "lesson_id" TEXT,
    "uploaded_by_id" TEXT NOT NULL,
    "delete_status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "certificate_number" TEXT NOT NULL,
    "verification_code" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdf_url" TEXT,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "certificates_certificate_number_key" ON "certificates"("certificate_number");
CREATE UNIQUE INDEX "certificates_verification_code_key" ON "certificates"("verification_code");
CREATE UNIQUE INDEX "certificates_student_id_course_id_key" ON "certificates"("student_id", "course_id");
CREATE INDEX "certificates_verification_code_idx" ON "certificates"("verification_code");
CREATE INDEX "certificates_course_id_idx" ON "certificates"("course_id");
CREATE INDEX "resources_course_id_delete_status_idx" ON "resources"("course_id", "delete_status");
CREATE INDEX "resources_lesson_id_delete_status_idx" ON "resources"("lesson_id", "delete_status");
CREATE INDEX "resources_uploaded_by_id_idx" ON "resources"("uploaded_by_id");

ALTER TABLE "resources" ADD CONSTRAINT "resources_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resources" ADD CONSTRAINT "resources_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "resources" ADD CONSTRAINT "resources_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "certificates" ADD CONSTRAINT "certificates_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
