import type { LiveClassStatus, Prisma, RecordingStatus, Role } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { logPrismaRouteError } from "../../utils/prisma-safe.js";
import {
  assertCanAccessLiveClass,
  assertCanAccessRecording,
  assertStudentBatchCourseAccess,
  assertTeacherOwnsBatch,
  getBatchOrThrow,
  getStudentBatchForCourse,
  resolveBatchCourseId,
} from "./live-classes-access.js";
import {
  mapRecordingStoredFile,
  saveLiveClassRecording,
} from "../../services/storage/recording-storage.js";
import { resolveLessonVideoUrl } from "../../services/storage/video-url.helpers.js";

const liveClassInclude = {
  batch: { select: { id: true, name: true, status: true } },
  course: { select: { id: true, title: true, slug: true } },
  teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
  recordings: {
    where: { status: { not: "DELETED" as RecordingStatus } },
    orderBy: { uploadedAt: "desc" as const },
    take: 20,
  },
  _count: { select: { recordings: true } },
} satisfies Prisma.LiveClassInclude;

const recordingInclude = {
  liveClass: { select: { id: true, title: true, scheduledAt: true } },
  batch: { select: { id: true, name: true } },
  course: { select: { id: true, title: true, slug: true } },
  teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.LiveClassRecordingInclude;

type LiveClassRow = Prisma.LiveClassGetPayload<{ include: typeof liveClassInclude }>;
type RecordingRow = Prisma.LiveClassRecordingGetPayload<{ include: typeof recordingInclude }>;

export function mapLiveClass(row: LiveClassRow) {
  return {
    id: row.id,
    batchId: row.batchId,
    batchName: row.batch.name,
    batchStatus: row.batch.status,
    courseId: row.courseId,
    courseTitle: row.course.title,
    courseSlug: row.course.slug,
    teacherId: row.teacherId,
    teacherName: `${row.teacher.firstName} ${row.teacher.lastName}`.trim(),
    title: row.title,
    description: row.description,
    scheduledAt: row.scheduledAt.toISOString(),
    durationMinutes: row.durationMinutes,
    duration: row.durationMinutes,
    status: row.status,
    liveUrl: row.liveUrl,
    recordingCount: row._count.recordings,
    recordings: row.recordings?.map((r) => ({
      id: r.id,
      title: r.title,
      videoUrl: resolveRecordingVideoUrl(r),
      status: r.status,
      uploadedAt: r.uploadedAt.toISOString(),
    })) ?? [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapRecording(row: RecordingRow) {
  const videoUrl = resolveRecordingVideoUrl(row);
  return {
    id: row.id,
    liveClassId: row.liveClassId,
    liveClassTitle: row.liveClass.title,
    liveClassScheduledAt: row.liveClass.scheduledAt.toISOString(),
    batchId: row.batchId,
    batchName: row.batch.name,
    courseId: row.courseId,
    courseTitle: row.course.title,
    courseSlug: row.course.slug,
    teacherId: row.teacherId,
    teacherName: `${row.teacher.firstName} ${row.teacher.lastName}`.trim(),
    title: row.title,
    description: row.description,
    videoUrl,
    videoStorageKey: row.videoStorageKey,
    videoStorageProvider: row.videoStorageProvider,
    videoFileName: row.videoFileName,
    videoMimeType: row.videoMimeType,
    videoSize: row.videoSize,
    durationSeconds: row.durationSeconds,
    status: row.status,
    uploadedAt: row.uploadedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function resolveRecordingVideoUrl(row: {
  videoUrl: string;
  videoStorageKey?: string | null;
  videoStorageProvider?: string | null;
}): string {
  return (
    resolveLessonVideoUrl({
      videoUrl: row.videoUrl,
      videoStorageKey: row.videoStorageKey,
      videoStorageProvider: row.videoStorageProvider,
    }) ?? row.videoUrl
  );
}

function buildListWhere(filters: {
  batchId?: string;
  courseId?: string;
  teacherId?: string;
  studentId?: string;
  status?: LiveClassStatus;
  upcoming?: boolean;
  from?: string;
  to?: string;
  search?: string;
}): Prisma.LiveClassWhereInput {
  const where: Prisma.LiveClassWhereInput = {};
  if (filters.batchId) where.batchId = filters.batchId;
  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.teacherId) where.teacherId = filters.teacherId;
  if (filters.status) where.status = filters.status;
  if (filters.studentId) {
    where.batch = { students: { some: { studentId: filters.studentId } }, status: "ACTIVE" };
  }
  if (filters.upcoming) {
    where.scheduledAt = { gte: new Date() };
    where.status = { in: ["SCHEDULED", "LIVE"] };
  }
  if (filters.from || filters.to) {
    where.scheduledAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listLiveClasses(filters: Parameters<typeof buildListWhere>[0]) {
  try {
    const rows = await prisma.liveClass.findMany({
      where: buildListWhere(filters),
      include: liveClassInclude,
      orderBy: { scheduledAt: "asc" },
      take: 100,
    });
    return rows.map(mapLiveClass);
  } catch (error) {
    logPrismaRouteError("/api/live-classes", error, "listLiveClasses");
    return [];
  }
}

export async function getLiveClassById(id: string, role: Role, userId: string) {
  const row = await prisma.liveClass.findUnique({ where: { id }, include: liveClassInclude });
  if (!row) throw ApiError.notFound("Live class not found");
  await assertCanAccessLiveClass(role, userId, row);
  return mapLiveClass(row);
}

export async function createLiveClass(
  input: {
    batchId: string;
    courseId?: string;
    teacherId?: string;
    title: string;
    description?: string;
    scheduledAt: string;
    durationMinutes?: number;
    liveUrl?: string;
  },
  actor: { role: Role; userId: string },
) {
  const batch = await getBatchOrThrow(input.batchId);
  const courseId = input.courseId ?? resolveBatchCourseId(batch);

  let teacherId = input.teacherId ?? batch.teacherId;
  if (!teacherId) throw ApiError.badRequest("Batch has no teacher assigned");

  if (actor.role === "TEACHER") {
    if (batch.teacherId !== actor.userId) {
      throw ApiError.forbidden("You can only schedule live classes for your assigned batches");
    }
    teacherId = actor.userId;
  }

  const row = await prisma.liveClass.create({
    data: {
      batchId: input.batchId,
      courseId,
      teacherId,
      title: input.title,
      description: input.description,
      scheduledAt: new Date(input.scheduledAt),
      durationMinutes: input.durationMinutes ?? 60,
      liveUrl: input.liveUrl || null,
    },
    include: liveClassInclude,
  });

  console.log("[live-classes] created", {
    id: row.id,
    batchId: row.batchId,
    courseId: row.courseId,
    teacherId: row.teacherId,
    scheduledAt: row.scheduledAt.toISOString(),
  });

  return mapLiveClass(row);
}

export async function updateLiveClass(
  id: string,
  input: {
    title?: string;
    description?: string | null;
    scheduledAt?: string;
    durationMinutes?: number;
    status?: LiveClassStatus;
    liveUrl?: string | null;
  },
  actor: { role: Role; userId: string },
) {
  const existing = await prisma.liveClass.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Live class not found");

  if (actor.role === "TEACHER") {
    await assertTeacherOwnsBatch(actor.userId, existing.batchId);
  } else if (actor.role !== "ADMIN") {
    throw ApiError.forbidden();
  }

  const row = await prisma.liveClass.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.scheduledAt !== undefined && { scheduledAt: new Date(input.scheduledAt) }),
      ...(input.durationMinutes !== undefined && { durationMinutes: input.durationMinutes }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.liveUrl !== undefined && { liveUrl: input.liveUrl || null }),
    },
    include: liveClassInclude,
  });

  return mapLiveClass(row);
}

export async function deleteLiveClass(id: string, actor: { role: Role; userId: string }) {
  const existing = await prisma.liveClass.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Live class not found");

  if (actor.role === "TEACHER") {
    await assertTeacherOwnsBatch(actor.userId, existing.batchId);
  } else if (actor.role !== "ADMIN") {
    throw ApiError.forbidden();
  }

  const row = await prisma.liveClass.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: liveClassInclude,
  });

  return mapLiveClass(row);
}

export async function listRecordings(
  filters: {
    batchId?: string;
    courseId?: string;
    liveClassId?: string;
    teacherId?: string;
    studentId?: string;
    status?: RecordingStatus;
  },
  actor: { role: Role; userId: string },
) {
  const where: Prisma.LiveClassRecordingWhereInput = {
    status: filters.status ?? { not: "DELETED" },
  };

  if (filters.batchId) where.batchId = filters.batchId;
  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.liveClassId) where.liveClassId = filters.liveClassId;
  if (filters.teacherId) where.teacherId = filters.teacherId;

  if (actor.role === "TEACHER") {
    where.batch = { teacherId: actor.userId };
  } else if (actor.role === "STUDENT") {
    where.batch = {
      status: "ACTIVE",
      students: { some: { studentId: actor.userId } },
    };
    if (filters.batchId) {
      const batch = await getBatchOrThrow(filters.batchId);
      const courseId = filters.courseId ?? resolveBatchCourseId(batch);
      await assertStudentBatchCourseAccess(actor.userId, filters.batchId, courseId);
    }
  }

  const rows = await prisma.liveClassRecording.findMany({
    where,
    include: recordingInclude,
    orderBy: { uploadedAt: "desc" },
    take: 100,
  });

  return rows.map(mapRecording);
}

export async function getRecordingById(id: string, actor: { role: Role; userId: string }) {
  const row = await prisma.liveClassRecording.findUnique({
    where: { id },
    include: recordingInclude,
  });
  if (!row) throw ApiError.notFound("Recording not found");
  await assertCanAccessRecording(actor.role, actor.userId, row);
  return mapRecording(row);
}

export async function uploadRecording(
  liveClassId: string,
  file: Express.Multer.File,
  input: { title: string; description?: string; durationSeconds?: number },
  actor: { role: Role; userId: string },
) {
  const liveClass = await prisma.liveClass.findUnique({
    where: { id: liveClassId },
    include: { batch: true },
  });
  if (!liveClass) throw ApiError.notFound("Live class not found");

  if (actor.role === "TEACHER") {
    await assertTeacherOwnsBatch(actor.userId, liveClass.batchId);
  } else if (actor.role !== "ADMIN") {
    throw ApiError.forbidden();
  }

  const stored = await saveLiveClassRecording(file, liveClass.batchId, liveClassId);
  const payload = mapRecordingStoredFile(stored);

  console.log("[recordings] upload response", {
    liveClassId,
    batchId: liveClass.batchId,
    publicUrl: payload.publicUrl,
    storageKey: payload.storageKey,
  });

  const row = await prisma.liveClassRecording.create({
    data: {
      liveClassId,
      batchId: liveClass.batchId,
      courseId: liveClass.courseId,
      teacherId: liveClass.teacherId,
      title: input.title,
      description: input.description,
      videoUrl: payload.publicUrl,
      videoStorageKey: payload.storageKey,
      videoStorageProvider: payload.storageProvider,
      videoFileName: payload.fileName,
      videoMimeType: payload.mimeType,
      videoSize: payload.fileSize,
      durationSeconds: input.durationSeconds,
    },
    include: recordingInclude,
  });

  console.log("[recordings] saved", { id: row.id, videoUrl: row.videoUrl });

  return mapRecording(row);
}

export async function updateRecordingStatus(
  id: string,
  status: RecordingStatus,
  actor: { role: Role; userId: string },
) {
  const existing = await prisma.liveClassRecording.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Recording not found");

  if (actor.role === "TEACHER") {
    await assertTeacherOwnsBatch(actor.userId, existing.batchId);
  } else if (actor.role !== "ADMIN") {
    throw ApiError.forbidden();
  }

  const row = await prisma.liveClassRecording.update({
    where: { id },
    data: { status },
    include: recordingInclude,
  });

  return mapRecording(row);
}

export async function getStudentCourseBatchRecordings(
  studentId: string,
  courseId: string,
) {
  const batch = await getStudentBatchForCourse(studentId, courseId);
  if (!batch) {
    return { batch: null, recordings: [] };
  }

  await assertStudentBatchCourseAccess(studentId, batch.id, courseId);

  const recordings = await prisma.liveClassRecording.findMany({
    where: {
      batchId: batch.id,
      courseId,
      status: "ACTIVE",
    },
    include: recordingInclude,
    orderBy: { uploadedAt: "desc" },
  });

  return {
    batch: { id: batch.id, name: batch.name },
    recordings: recordings.map(mapRecording),
  };
}

export async function getUpcomingCount() {
  try {
    return await prisma.liveClass.count({
      where: {
        scheduledAt: { gte: new Date() },
        status: { in: ["SCHEDULED", "LIVE"] },
      },
    });
  } catch (error) {
    logPrismaRouteError("/api/dashboard/admin", error, "getUpcomingCount");
    return 0;
  }
}

export async function getLiveClassStats(actor: { role: Role; userId: string }) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const classWhere: Prisma.LiveClassWhereInput =
    actor.role === "TEACHER"
      ? { teacherId: actor.userId }
      : actor.role === "STUDENT"
        ? { batch: { students: { some: { studentId: actor.userId } }, status: "ACTIVE" } }
        : {};

  const recordingWhere: Prisma.LiveClassRecordingWhereInput = {
    status: "ACTIVE",
    ...(actor.role === "TEACHER"
      ? { batch: { teacherId: actor.userId } }
      : actor.role === "STUDENT"
        ? { batch: { students: { some: { studentId: actor.userId } }, status: "ACTIVE" } }
        : {}),
  };

  const [upcoming, completed, today, totalRecordings] = await Promise.all([
    prisma.liveClass.count({
      where: {
        ...classWhere,
        scheduledAt: { gte: new Date() },
        status: { in: ["SCHEDULED", "LIVE"] },
      },
    }),
    prisma.liveClass.count({
      where: { ...classWhere, status: "COMPLETED" },
    }),
    prisma.liveClass.count({
      where: {
        ...classWhere,
        scheduledAt: { gte: todayStart, lte: todayEnd },
        status: { in: ["SCHEDULED", "LIVE", "COMPLETED"] },
      },
    }),
    prisma.liveClassRecording.count({ where: recordingWhere }),
  ]);

  return { upcoming, completed, today, totalRecordings };
}
