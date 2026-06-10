import type { AccessType, Role } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { mapCourse } from "../courses/courses.mapper.js";
import { mapEnrollment } from "../learning/learning.mapper.js";
import { logPrismaRouteError } from "../../utils/prisma-safe.js";
import { toNumber } from "../fees/fees.helpers.js";

const courseInclude = {
  teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
  modules: {
    where: { deleteStatus: "ACTIVE" as const },
    orderBy: { order: "asc" as const },
    include: {
      lessons: {
        where: { deleteStatus: "ACTIVE" as const },
        orderBy: { order: "asc" as const },
      },
    },
  },
} as const;

export async function ensureEnrollment(studentId: string, courseId: string) {
  return prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId, courseId } },
    create: { studentId, courseId },
    update: {},
  });
}

export async function hasActiveCourseAccess(studentId: string, courseId: string) {
  try {
    const access = await prisma.studentCourseAccess.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!access || access.revokedAt) return false;
    if (!access.lifetimeAccess && access.expiresAt && access.expiresAt < new Date()) {
      return false;
    }

    if (!access.lifetimeAccess && access.accessType !== "TRIAL") {
      const pendingFee = await prisma.feePlan.findFirst({
        where: {
          studentId,
          courseId,
          pendingAmount: { gt: 0 },
          status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
        },
      });
      if (pendingFee) return false;
    }

    return true;
  } catch (error) {
    logPrismaRouteError("/api/course-access", error, "hasActiveCourseAccess");
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    return Boolean(enrollment);
  }
}

export async function assertStudentCourseAccess(studentId: string, courseId: string) {
  const allowed = await hasActiveCourseAccess(studentId, courseId);
  if (!allowed) {
    throw ApiError.forbidden(
      "You do not have access to this course. Contact your institute admin.",
      "COURSE_ACCESS_DENIED",
    );
  }
  return ensureEnrollment(studentId, courseId);
}

export async function getAccessStatus(studentId: string, courseId?: string) {
  const accessList = await prisma.studentCourseAccess.findMany({
    where: {
      studentId,
      ...(courseId ? { courseId } : {}),
      revokedAt: null,
    },
    include: { course: { select: { id: true, title: true, slug: true } } },
  });

  const feePlans = await prisma.feePlan.findMany({
    where: { studentId, ...(courseId ? { courseId } : {}) },
    select: { courseId: true, pendingAmount: true, lifetimeAccess: true, status: true },
  });

  return accessList.map((a) => {
    const fee = feePlans.find((f) => f.courseId === a.courseId);
    const pending = fee ? toNumber(fee.pendingAmount) > 0 : false;
    let label = "Active";
    if (a.lifetimeAccess || fee?.lifetimeAccess) label = "Lifetime access granted";
    else if (pending && !a.lifetimeAccess) label = "Pending fee";

    return {
      id: a.id,
      courseId: a.courseId,
      courseTitle: a.course.title,
      courseSlug: a.course.slug,
      accessType: a.accessType,
      lifetimeAccess: a.lifetimeAccess,
      accessLabel: label,
      startsAt: a.startsAt.toISOString(),
      expiresAt: a.expiresAt?.toISOString() ?? null,
    };
  });
}

async function upsertAccess(input: {
  studentId: string;
  courseId: string;
  assignedById: string;
  accessType: AccessType;
  lifetimeAccess?: boolean;
  expiresAt?: Date | null;
}) {
  const access = await prisma.studentCourseAccess.upsert({
    where: {
      studentId_courseId: { studentId: input.studentId, courseId: input.courseId },
    },
    create: {
      studentId: input.studentId,
      courseId: input.courseId,
      assignedById: input.assignedById,
      accessType: input.accessType,
      lifetimeAccess: input.lifetimeAccess ?? false,
      expiresAt: input.expiresAt ?? null,
      revokedAt: null,
    },
    update: {
      assignedById: input.assignedById,
      accessType: input.accessType,
      lifetimeAccess: input.lifetimeAccess ?? false,
      expiresAt: input.expiresAt ?? null,
      revokedAt: null,
    },
  });

  await ensureEnrollment(input.studentId, input.courseId);
  return access;
}

export async function assignCourseToStudent(
  adminId: string,
  input: {
    studentId: string;
    courseId: string;
    accessType?: AccessType;
    lifetimeAccess?: boolean;
    expiresAt?: string | null;
  },
) {
  const student = await prisma.user.findFirst({
    where: { id: input.studentId, role: "STUDENT", suspended: false },
  });
  if (!student) throw ApiError.badRequest("Student not found");

  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course) throw ApiError.notFound("Course not found");
  if (course.deleteStatus !== "ACTIVE" || course.status === "ARCHIVED") {
    throw ApiError.badRequest("Course is not available for assignment", "COURSE_UNAVAILABLE");
  }

  const existingAccess = await prisma.studentCourseAccess.findUnique({
    where: { studentId_courseId: { studentId: input.studentId, courseId: input.courseId } },
  });
  if (existingAccess && !existingAccess.revokedAt) {
    throw ApiError.conflict("Student already has access to this course", "ACCESS_EXISTS");
  }

  const access = await upsertAccess({
    studentId: input.studentId,
    courseId: input.courseId,
    assignedById: adminId,
    accessType: input.accessType ?? "ADMIN_ASSIGNED",
    lifetimeAccess: input.lifetimeAccess,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  });

  return { id: access.id, studentId: access.studentId, courseId: access.courseId };
}

export async function grantLifetimeAccess(adminId: string, studentId: string, courseId: string) {
  return assignCourseToStudent(adminId, {
    studentId,
    courseId,
    accessType: "FULL_FEE_PAID",
    lifetimeAccess: true,
  });
}

export async function revokeStudentAccess(studentId: string, courseId: string) {
  const access = await prisma.studentCourseAccess.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!access) throw ApiError.notFound("Access record not found");

  await prisma.studentCourseAccess.update({
    where: { id: access.id },
    data: { revokedAt: new Date() },
  });

  return { success: true };
}

export async function assignCourseToBatch(
  adminId: string,
  batchId: string,
  courseId: string,
) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { students: true },
  });
  if (!batch) throw ApiError.notFound("Batch not found");

  await prisma.batchCourse.upsert({
    where: { batchId_courseId: { batchId, courseId } },
    create: { batchId, courseId },
    update: {},
  });

  for (const member of batch.students) {
    await upsertAccess({
      studentId: member.studentId,
      courseId,
      assignedById: adminId,
      accessType: "BATCH_ASSIGNED",
    });
  }

  return { batchId, courseId, studentsUpdated: batch.students.length };
}

export async function syncBatchAccessForStudent(
  batchId: string,
  studentId: string,
  assignedById: string,
) {
  const courses = await prisma.batchCourse.findMany({ where: { batchId } });
  const legacy = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { courseId: true },
  });
  const courseIds = new Set(courses.map((c) => c.courseId));
  if (legacy?.courseId) courseIds.add(legacy.courseId);

  for (const courseId of courseIds) {
    await upsertAccess({
      studentId,
      courseId,
      assignedById,
      accessType: "BATCH_ASSIGNED",
    });
  }
}

export async function grantAccessFromFeePlan(
  studentId: string,
  courseId: string,
  assignedById: string,
  lifetime: boolean,
) {
  await upsertAccess({
    studentId,
    courseId,
    assignedById,
    accessType: "FULL_FEE_PAID",
    lifetimeAccess: lifetime,
  });
}

export async function listAllAccess(filters?: { studentId?: string; courseId?: string }) {
  const rows = await prisma.studentCourseAccess.findMany({
    where: {
      revokedAt: null,
      course: { deleteStatus: { not: "DELETED" }, status: { not: "ARCHIVED" } },
      ...(filters?.studentId ? { studentId: filters.studentId } : {}),
      ...(filters?.courseId ? { courseId: filters.courseId } : {}),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
      assignedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    studentName: `${r.student.firstName} ${r.student.lastName}`.trim(),
    studentEmail: r.student.email,
    courseId: r.courseId,
    courseTitle: r.course.title,
    courseSlug: r.course.slug,
    accessType: r.accessType,
    lifetimeAccess: r.lifetimeAccess,
    startsAt: r.startsAt.toISOString(),
    expiresAt: r.expiresAt?.toISOString() ?? null,
    assignedByName: `${r.assignedBy.firstName} ${r.assignedBy.lastName}`.trim(),
  }));
}

export async function getAssignedCoursesForStudent(studentId: string) {
  try {
    const accessRows = await prisma.studentCourseAccess.findMany({
      where: {
        studentId,
        revokedAt: null,
        course: { deleteStatus: "ACTIVE", status: "APPROVED" },
      },
      include: {
        course: { include: courseInclude },
      },
      orderBy: { createdAt: "desc" },
    });

    const results = [];
    for (const row of accessRows) {
      const active = await hasActiveCourseAccess(studentId, row.courseId);
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId: row.courseId } },
      });

      results.push({
        accessId: row.id,
        accessType: row.accessType,
        lifetimeAccess: row.lifetimeAccess,
        accessActive: active,
        accessLabel: active
          ? row.lifetimeAccess
            ? "Lifetime access granted"
            : "Active"
          : "Pending fee",
        enrollment: enrollment ? mapEnrollment(enrollment) : null,
        course: mapCourse(row.course, true),
      });
    }

    return results;
  } catch (error) {
    logPrismaRouteError("/api/course-access/my-courses", error, "getAssignedCoursesForStudent");
    const { getActiveCourseWhereClause } = await import("../courses/courses.helpers.js");
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId, course: getActiveCourseWhereClause() },
      include: { course: { include: courseInclude } },
    });
    return enrollments.map((e) => ({
      accessId: null,
      accessType: "ADMIN_ASSIGNED" as AccessType,
      lifetimeAccess: false,
      accessActive: true,
      accessLabel: "Active",
      enrollment: mapEnrollment(e),
      course: mapCourse(e.course, true),
    }));
  }
}

export async function getStudentCourseAccessFlags(
  studentId: string,
  courseId: string,
  role?: Role,
) {
  if (role === "ADMIN") {
    return { assigned: true, canLearn: true, accessLabel: "Admin preview" };
  }
  const access = await prisma.studentCourseAccess.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  const assigned = Boolean(access && !access.revokedAt);
  const canLearn = assigned ? await hasActiveCourseAccess(studentId, courseId) : false;
  let accessLabel = "Not assigned";
  if (access?.lifetimeAccess) accessLabel = "Lifetime access granted";
  else if (canLearn) accessLabel = "Active";
  else if (assigned) accessLabel = "Pending fee";

  return { assigned, canLearn, accessLabel };
}
