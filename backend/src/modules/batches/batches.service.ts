import type { BatchStatus, Prisma } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { batchInclude, mapBatch } from "./batches.helpers.js";
import { toNumber } from "../fees/fees.helpers.js";
import { logPrismaRouteError } from "../../utils/prisma-safe.js";

async function studentAccessMap(studentIds: string[]) {
  if (studentIds.length === 0) return {};
  const plans = await prisma.feePlan.findMany({
    where: { studentId: { in: studentIds } },
    select: {
      studentId: true,
      lifetimeAccess: true,
      accessGranted: true,
      pendingAmount: true,
    },
  });

  const map: Record<string, string> = {};
  for (const id of studentIds) {
    const studentPlans = plans.filter((p) => p.studentId === id);
    if (studentPlans.some((p) => p.lifetimeAccess)) {
      map[id] = "Lifetime access granted";
    } else if (studentPlans.some((p) => p.accessGranted)) {
      map[id] = "Active";
    } else if (studentPlans.some((p) => toNumber(p.pendingAmount) > 0)) {
      map[id] = "Pending fee";
    } else if (studentPlans.length === 0) {
      map[id] = "Active";
    } else {
      map[id] = "Active";
    }
  }
  return map;
}

export async function listBatches(filters: {
  status?: BatchStatus;
  search?: string;
  teacherId?: string;
  includeDeleted?: boolean;
}) {
  const where: Prisma.BatchWhereInput = {};
  if (filters.status) {
    where.status = filters.status;
  } else if (!filters.includeDeleted) {
    where.status = { not: "DELETED" };
  }
  if (filters.teacherId) where.teacherId = filters.teacherId;
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const batches = await prisma.batch.findMany({
    where,
    include: batchInclude,
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
  });

  return batches.map((b) => mapBatch(b));
}

export async function getBatchById(id: string, options?: { includeAccess?: boolean }) {
  const batch = await prisma.batch.findUnique({ where: { id }, include: batchInclude });
  if (!batch) throw ApiError.notFound("Batch not found");

  let access: Record<string, string> | undefined;
  if (options?.includeAccess) {
    access = await studentAccessMap(batch.students.map((s) => s.studentId));
  }

  return mapBatch(batch, { studentAccess: access });
}

export async function createBatch(
  input: {
    name: string;
    description?: string;
    courseId?: string | null;
    teacherId?: string | null;
    studentIds?: string[];
    startDate: string;
    endDate?: string | null;
    timing?: string;
    daysOfWeek?: string;
    status?: BatchStatus;
  },
  assignedById: string,
) {
  if (input.teacherId) {
    const teacher = await prisma.user.findFirst({
      where: { id: input.teacherId, role: "TEACHER", suspended: false },
    });
    if (!teacher) throw ApiError.badRequest("Teacher not found");
  }

  if (input.courseId) {
    const { getActiveCourseWhereClause } = await import("../courses/courses.helpers.js");
    const course = await prisma.course.findFirst({
      where: { id: input.courseId, status: "APPROVED", ...getActiveCourseWhereClause() },
    });
    if (!course) throw ApiError.badRequest("Course not found or is no longer active");
  }

  const studentIds = [...new Set(input.studentIds ?? [])];
  if (studentIds.length > 0) {
    const students = await prisma.user.findMany({
      where: { id: { in: studentIds }, role: "STUDENT", suspended: false },
    });
    if (students.length !== studentIds.length) {
      throw ApiError.badRequest("One or more students not found");
    }
  }

  const batch = await prisma.batch.create({
    data: {
      name: input.name,
      description: input.description,
      courseId: input.courseId ?? null,
      teacherId: input.teacherId ?? null,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      timing: input.timing,
      daysOfWeek: input.daysOfWeek,
      status: input.status ?? "ACTIVE",
      ...(input.courseId
        ? { courses: { create: { courseId: input.courseId } } }
        : {}),
      ...(studentIds.length
        ? {
            students: {
              create: studentIds.map((studentId) => ({ studentId })),
            },
          }
        : {}),
    },
    include: batchInclude,
  });

  if (studentIds.length > 0) {
    const { syncBatchAccessForStudent } = await import(
      "../course-access/course-access.service.js"
    );
    for (const studentId of studentIds) {
      await syncBatchAccessForStudent(batch.id, studentId, assignedById);
    }
  }

  return getBatchById(batch.id, { includeAccess: true });
}

export async function updateBatch(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    courseId: string | null;
    teacherId: string | null;
    startDate: string;
    endDate: string | null;
    timing: string;
    daysOfWeek: string;
    status: BatchStatus;
  }>,
) {
  const existing = await prisma.batch.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Batch not found");

  const batch = await prisma.batch.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      courseId: input.courseId,
      teacherId: input.teacherId,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate:
        input.endDate === null ? null : input.endDate ? new Date(input.endDate) : undefined,
      timing: input.timing,
      daysOfWeek: input.daysOfWeek,
      status: input.status,
    },
    include: batchInclude,
  });

  return mapBatch(batch);
}

export async function addStudentsToBatch(
  batchId: string,
  studentIds: string[],
  assignedById: string,
) {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) throw ApiError.notFound("Batch not found");

  const students = await prisma.user.findMany({
    where: { id: { in: studentIds }, role: "STUDENT", suspended: false },
  });
  if (students.length !== studentIds.length) {
    throw ApiError.badRequest("One or more students not found");
  }

  await prisma.batchStudent.createMany({
    data: studentIds.map((studentId) => ({ batchId, studentId })),
    skipDuplicates: true,
  });

  const { syncBatchAccessForStudent } = await import(
    "../course-access/course-access.service.js"
  );
  for (const studentId of studentIds) {
    await syncBatchAccessForStudent(batchId, studentId, assignedById);
  }

  return getBatchById(batchId, { includeAccess: true });
}

export async function removeStudentFromBatch(batchId: string, studentId: string) {
  await prisma.batchStudent.deleteMany({ where: { batchId, studentId } });
  return getBatchById(batchId, { includeAccess: true });
}

export async function deleteBatch(batchId: string) {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) throw ApiError.notFound("Batch not found");
  if (batch.status === "DELETED") {
    throw ApiError.badRequest("Batch is already deleted");
  }

  await prisma.batch.update({
    where: { id: batchId },
    data: { status: "DELETED" },
  });

  return { message: "Batch deleted" };
}

export async function getTeacherBatches(teacherId: string) {
  try {
    const batches = await prisma.batch.findMany({
      where: { teacherId, status: { not: "DELETED" } },
      include: batchInclude,
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
    });

    const result = [];
    for (const batch of batches) {
      const access = await studentAccessMap(batch.students.map((s) => s.studentId));
      result.push(mapBatch(batch, { studentAccess: access }));
    }
    return result;
  } catch (error) {
    logPrismaRouteError("/api/dashboard/teacher", error, "getTeacherBatches");
    return [];
  }
}

export async function getStudentBatch(studentId: string) {
  try {
    return await loadStudentBatch(studentId);
  } catch (error) {
    logPrismaRouteError("/api/dashboard/student", error, "getStudentBatch");
    return null;
  }
}

async function loadStudentBatch(studentId: string) {
  const membership = await prisma.batchStudent.findFirst({
    where: { studentId, batch: { status: "ACTIVE" } },
    include: { batch: { include: batchInclude } },
    orderBy: { joinedAt: "desc" },
  });

  if (!membership) {
    const any = await prisma.batchStudent.findFirst({
      where: { studentId, batch: { status: { not: "DELETED" } } },
      include: { batch: { include: batchInclude } },
      orderBy: { joinedAt: "desc" },
    });
    if (!any) return null;
    return mapBatch(any.batch);
  }

  return mapBatch(membership.batch);
}

export async function assertTeacherBatchAccess(teacherId: string, batchId: string) {
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, teacherId },
  });
  if (!batch) throw ApiError.forbidden("Batch not assigned to you");
  return batch;
}

export async function getActiveBatchCount() {
  try {
    return await prisma.batch.count({ where: { status: "ACTIVE" } });
  } catch (error) {
    logPrismaRouteError("/api/dashboard/admin", error, "getActiveBatchCount");
    return 0;
  }
}
