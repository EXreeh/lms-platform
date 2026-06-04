import type { Prisma } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";

const include = {
  batch: { select: { id: true, name: true } },
  teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.LiveClassInclude;

function mapLiveClass(row: Prisma.LiveClassGetPayload<{ include: typeof include }>) {
  return {
    id: row.id,
    batchId: row.batchId,
    batchName: row.batch.name,
    teacherId: row.teacherId,
    teacherName: `${row.teacher.firstName} ${row.teacher.lastName}`.trim(),
    title: row.title,
    description: row.description,
    scheduledAt: row.scheduledAt.toISOString(),
    duration: row.duration,
    status: row.status,
    meetingUrl: row.meetingUrl,
    createdAt: row.createdAt.toISOString(),
    joinMessage: "Live class system coming soon",
  };
}

export async function listLiveClasses(filters: {
  batchId?: string;
  teacherId?: string;
  studentId?: string;
  upcoming?: boolean;
}) {
  const where: Prisma.LiveClassWhereInput = {};

  if (filters.batchId) where.batchId = filters.batchId;
  if (filters.teacherId) where.teacherId = filters.teacherId;
  if (filters.studentId) {
    where.batch = { students: { some: { studentId: filters.studentId } } };
  }
  if (filters.upcoming) {
    where.scheduledAt = { gte: new Date() };
    where.status = { in: ["SCHEDULED", "LIVE"] };
  }

  const rows = await prisma.liveClass.findMany({
    where,
    include,
    orderBy: { scheduledAt: "asc" },
    take: 50,
  });

  return rows.map(mapLiveClass);
}

export async function createLiveClass(input: {
  batchId: string;
  teacherId?: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration?: number;
}) {
  const batch = await prisma.batch.findUnique({ where: { id: input.batchId } });
  if (!batch) throw ApiError.notFound("Batch not found");

  const teacherId = input.teacherId ?? batch.teacherId;
  if (!teacherId) throw ApiError.badRequest("Batch has no teacher assigned");

  const row = await prisma.liveClass.create({
    data: {
      batchId: input.batchId,
      teacherId,
      title: input.title,
      description: input.description,
      scheduledAt: new Date(input.scheduledAt),
      duration: input.duration ?? 60,
    },
    include,
  });

  return mapLiveClass(row);
}

export async function getUpcomingCount() {
  return prisma.liveClass.count({
    where: {
      scheduledAt: { gte: new Date() },
      status: { in: ["SCHEDULED", "LIVE"] },
    },
  });
}
