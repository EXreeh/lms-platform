-- Batch soft-delete status
ALTER TYPE "BatchStatus" ADD VALUE IF NOT EXISTS 'DELETED';

-- Teacher attendance
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY');
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "teacher_attendance" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "marked_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_attendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teacher_leave_requests" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "from_date" DATE NOT NULL,
    "to_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_leave_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "teacher_attendance_teacher_id_date_key" ON "teacher_attendance"("teacher_id", "date");
CREATE INDEX "teacher_attendance_date_status_idx" ON "teacher_attendance"("date", "status");
CREATE INDEX "teacher_leave_requests_teacher_id_status_idx" ON "teacher_leave_requests"("teacher_id", "status");
CREATE INDEX "teacher_leave_requests_status_from_date_idx" ON "teacher_leave_requests"("status", "from_date");

ALTER TABLE "teacher_attendance" ADD CONSTRAINT "teacher_attendance_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teacher_leave_requests" ADD CONSTRAINT "teacher_leave_requests_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teacher_leave_requests" ADD CONSTRAINT "teacher_leave_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
