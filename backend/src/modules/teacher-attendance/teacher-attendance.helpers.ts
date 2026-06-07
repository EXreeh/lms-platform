import type { AttendanceStatus, LeaveStatus } from "@lms/database";

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isPastDay(date: Date): boolean {
  const today = startOfDay(new Date());
  return startOfDay(date) < today;
}

export function mapAttendance(row: {
  id: string;
  teacherId: string;
  date: Date;
  status: AttendanceStatus;
  markedAt: Date;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  teacher?: { id: string; firstName: string; lastName: string; email: string };
}) {
  return {
    id: row.id,
    teacherId: row.teacherId,
    teacherName: row.teacher
      ? `${row.teacher.firstName} ${row.teacher.lastName}`.trim()
      : undefined,
    teacherEmail: row.teacher?.email,
    date: row.date.toISOString().slice(0, 10),
    status: row.status,
    markedAt: row.markedAt.toISOString(),
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapLeave(row: {
  id: string;
  teacherId: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
  status: LeaveStatus;
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  teacher?: { id: string; firstName: string; lastName: string; email: string };
  reviewedBy?: { id: string; firstName: string; lastName: string } | null;
}) {
  return {
    id: row.id,
    teacherId: row.teacherId,
    teacherName: row.teacher
      ? `${row.teacher.firstName} ${row.teacher.lastName}`.trim()
      : undefined,
    teacherEmail: row.teacher?.email,
    fromDate: row.fromDate.toISOString().slice(0, 10),
    toDate: row.toDate.toISOString().slice(0, 10),
    reason: row.reason,
    status: row.status,
    reviewedById: row.reviewedById,
    reviewedByName: row.reviewedBy
      ? `${row.reviewedBy.firstName} ${row.reviewedBy.lastName}`.trim()
      : null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
