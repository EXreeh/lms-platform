import type { AttendanceStatus, Prisma } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { isPastDay, mapAttendance, mapLeave, startOfDay } from "./teacher-attendance.helpers.js";

const teacherInclude = {
  teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
} as const;

const leaveInclude = {
  teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
  reviewedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

export async function markTeacherAttendance(
  teacherId: string,
  input: { status: "PRESENT" | "LEAVE"; note?: string },
) {
  const today = startOfDay(new Date());
  const existing = await prisma.teacherAttendance.findUnique({
    where: { teacherId_date: { teacherId, date: today } },
  });
  if (existing && isPastDay(existing.date)) {
    throw ApiError.forbidden("Cannot edit attendance after the day has ended");
  }

  const row = await prisma.teacherAttendance.upsert({
    where: { teacherId_date: { teacherId, date: today } },
    create: {
      teacherId,
      date: today,
      status: input.status,
      markedAt: new Date(),
      note: input.note,
    },
    update: {
      status: input.status,
      markedAt: new Date(),
      note: input.note,
    },
    include: teacherInclude,
  });

  return mapAttendance(row);
}

export async function getTeacherAttendanceHistory(teacherId: string, limit = 60) {
  const rows = await prisma.teacherAttendance.findMany({
    where: { teacherId },
    include: teacherInclude,
    orderBy: { date: "desc" },
    take: limit,
  });
  return rows.map(mapAttendance);
}

export async function submitLeaveRequest(
  teacherId: string,
  input: { fromDate: string; toDate: string; reason: string },
) {
  const from = startOfDay(new Date(input.fromDate));
  const to = startOfDay(new Date(input.toDate));
  if (to < from) throw ApiError.badRequest("End date must be on or after start date");

  const row = await prisma.teacherLeaveRequest.create({
    data: {
      teacherId,
      fromDate: from,
      toDate: to,
      reason: input.reason,
    },
    include: leaveInclude,
  });

  return mapLeave(row);
}

export async function getTeacherLeaveRequests(teacherId: string) {
  const rows = await prisma.teacherLeaveRequest.findMany({
    where: { teacherId },
    include: leaveInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map(mapLeave);
}

export async function listAttendance(filters: {
  teacherId?: string;
  date?: string;
  from?: string;
  to?: string;
  status?: AttendanceStatus;
}) {
  const where: Prisma.TeacherAttendanceWhereInput = {};
  if (filters.teacherId) where.teacherId = filters.teacherId;
  if (filters.status) where.status = filters.status;
  if (filters.date) where.date = startOfDay(new Date(filters.date));
  if (filters.from || filters.to) {
    where.date = {
      ...(filters.from ? { gte: startOfDay(new Date(filters.from)) } : {}),
      ...(filters.to ? { lte: startOfDay(new Date(filters.to)) } : {}),
    };
  }

  const rows = await prisma.teacherAttendance.findMany({
    where,
    include: teacherInclude,
    orderBy: [{ date: "desc" }, { teacher: { lastName: "asc" } }],
    take: 500,
  });
  return rows.map(mapAttendance);
}

export async function adminUpdateAttendance(
  id: string,
  input: { status: AttendanceStatus; note?: string | null },
) {
  const existing = await prisma.teacherAttendance.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Attendance record not found");

  const row = await prisma.teacherAttendance.update({
    where: { id },
    data: {
      status: input.status,
      note: input.note,
      markedAt: new Date(),
    },
    include: teacherInclude,
  });
  return mapAttendance(row);
}

export async function listLeaveRequests(filters?: { status?: "PENDING" | "APPROVED" | "REJECTED" }) {
  const rows = await prisma.teacherLeaveRequest.findMany({
    where: filters?.status ? { status: filters.status } : undefined,
    include: leaveInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(mapLeave);
}

export async function reviewLeaveRequest(
  adminId: string,
  id: string,
  approve: boolean,
) {
  const existing = await prisma.teacherLeaveRequest.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Leave request not found");
  if (existing.status !== "PENDING") {
    throw ApiError.badRequest("Leave request already reviewed");
  }

  const row = await prisma.teacherLeaveRequest.update({
    where: { id },
    data: {
      status: approve ? "APPROVED" : "REJECTED",
      reviewedById: adminId,
      reviewedAt: new Date(),
    },
    include: leaveInclude,
  });

  if (approve) {
    const day = new Date(existing.fromDate);
    const end = new Date(existing.toDate);
    while (day <= end) {
      const d = startOfDay(day);
      await prisma.teacherAttendance.upsert({
        where: { teacherId_date: { teacherId: existing.teacherId, date: d } },
        create: {
          teacherId: existing.teacherId,
          date: d,
          status: "LEAVE",
          markedAt: new Date(),
          note: `Approved leave: ${existing.reason.slice(0, 200)}`,
        },
        update: { status: "LEAVE", markedAt: new Date() },
      });
      day.setDate(day.getDate() + 1);
    }
  }

  return mapLeave(row);
}

export async function markMissingTeachersAbsent(dateInput?: string) {
  const date = dateInput ? startOfDay(new Date(dateInput)) : startOfDay(new Date());
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", suspended: false },
    select: { id: true },
  });

  let marked = 0;
  for (const teacher of teachers) {
    const existing = await prisma.teacherAttendance.findUnique({
      where: { teacherId_date: { teacherId: teacher.id, date } },
    });
    if (!existing) {
      await prisma.teacherAttendance.create({
        data: {
          teacherId: teacher.id,
          date,
          status: "ABSENT",
          markedAt: new Date(),
          note: "Auto-marked absent (no attendance recorded)",
        },
      });
      marked += 1;
    }
  }

  return { date: date.toISOString().slice(0, 10), marked };
}

export async function getAttendanceDashboardSummary(dateInput?: string) {
  const date = dateInput ? startOfDay(new Date(dateInput)) : startOfDay(new Date());
  const [present, absent, leave, pendingLeaves] = await Promise.all([
    prisma.teacherAttendance.count({ where: { date, status: "PRESENT" } }),
    prisma.teacherAttendance.count({ where: { date, status: "ABSENT" } }),
    prisma.teacherAttendance.count({ where: { date, status: { in: ["LEAVE", "HALF_DAY"] } } }),
    prisma.teacherLeaveRequest.count({ where: { status: "PENDING" } }),
  ]);

  const totalTeachers = await prisma.user.count({
    where: { role: "TEACHER", suspended: false },
  });

  return {
    date: date.toISOString().slice(0, 10),
    totalTeachers,
    present,
    absent,
    onLeave: leave,
    pendingLeaveRequests: pendingLeaves,
  };
}
