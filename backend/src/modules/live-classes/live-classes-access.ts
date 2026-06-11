import type { Role } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { isAdminRole } from "../../utils/roles.js";
import { hasActiveCourseAccess } from "../course-access/course-access.service.js";

export async function getBatchOrThrow(batchId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      courses: { include: { course: { select: { id: true, title: true, slug: true } } } },
    },
  });
  if (!batch || batch.status === "DELETED") {
    throw ApiError.notFound("Batch not found");
  }
  return batch;
}

export function resolveBatchCourseId(batch: {
  courseId: string | null;
  courses: { courseId: string }[];
}): string {
  if (batch.courseId) return batch.courseId;
  const fromJunction = batch.courses[0]?.courseId;
  if (!fromJunction) {
    throw ApiError.badRequest("Batch has no course assigned. Link a course before scheduling live classes.");
  }
  return fromJunction;
}

export async function assertTeacherOwnsBatch(teacherId: string, batchId: string) {
  const batch = await getBatchOrThrow(batchId);
  if (batch.teacherId !== teacherId) {
    throw ApiError.forbidden("You can only manage live classes for your assigned batches");
  }
  return batch;
}

export async function assertStudentInBatch(studentId: string, batchId: string) {
  const batch = await getBatchOrThrow(batchId);
  if (batch.status !== "ACTIVE") {
    throw ApiError.forbidden("This batch is not active");
  }
  const membership = await prisma.batchStudent.findUnique({
    where: { batchId_studentId: { batchId, studentId } },
  });
  if (!membership) {
    throw ApiError.forbidden("You are not assigned to this batch", "BATCH_ACCESS_DENIED");
  }
  return batch;
}

export async function assertStudentBatchCourseAccess(studentId: string, batchId: string, courseId: string) {
  await assertStudentInBatch(studentId, batchId);
  const allowed = await hasActiveCourseAccess(studentId, courseId);
  if (!allowed) {
    throw ApiError.forbidden("You do not have access to this course", "COURSE_ACCESS_DENIED");
  }
}

export async function getStudentBatchForCourse(studentId: string, courseId: string) {
  const membership = await prisma.batchStudent.findFirst({
    where: {
      studentId,
      batch: {
        status: "ACTIVE",
        OR: [{ courseId }, { courses: { some: { courseId } } }],
      },
    },
    include: { batch: true },
  });
  return membership?.batch ?? null;
}

export async function assertCanAccessLiveClass(
  role: Role,
  userId: string,
  liveClass: { batchId: string; teacherId: string; courseId: string },
) {
  if (isAdminRole(role)) return;
  if (role === "TEACHER") {
    const batch = await getBatchOrThrow(liveClass.batchId);
    if (batch.teacherId !== userId) {
      throw ApiError.forbidden("You can only access live classes for your assigned batches");
    }
    return;
  }
  if (role === "STUDENT") {
    await assertStudentBatchCourseAccess(userId, liveClass.batchId, liveClass.courseId);
    return;
  }
  throw ApiError.forbidden();
}

export async function assertCanAccessRecording(
  role: Role,
  userId: string,
  recording: {
    batchId: string;
    teacherId: string;
    courseId: string;
    status: string;
  },
) {
  if (recording.status === "DELETED") {
    throw ApiError.notFound("Recording not found");
  }
  if (isAdminRole(role)) return;
  if (role === "TEACHER") {
    const batch = await getBatchOrThrow(recording.batchId);
    if (batch.teacherId !== userId) {
      throw ApiError.forbidden("You can only access recordings for your assigned batches");
    }
    return;
  }
  if (role === "STUDENT") {
    await assertStudentBatchCourseAccess(userId, recording.batchId, recording.courseId);
    return;
  }
  throw ApiError.forbidden();
}
