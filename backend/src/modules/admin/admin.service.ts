import type { Prisma, Role } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { hashPassword } from "../../utils/password.js";
import { mapCourse } from "../courses/courses.mapper.js";
import * as coursesService from "../courses/courses.service.js";
import { courseNotDeletedFilter } from "../courses/courses.helpers.js";
import { activityMessage, logActivity } from "./activity.service.js";
import type {
  ChangeRoleInput,
  CreateAdminInput,
  CreateStudentInput,
  CreateTeacherInput,
  ListActivityQuery,
  ListAdminCoursesQuery,
  ListUsersQuery,
  ResetPasswordInput,
  SuspendUserInput,
} from "./admin.validation.js";
import { notifyAccountCredentials } from "./credentials.helper.js";

const teacherSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const courseInclude = {
  teacher: { select: teacherSelect },
  modules: {
    orderBy: { order: "asc" as const },
    include: { lessons: { orderBy: { order: "asc" as const } } },
  },
  _count: { select: { enrollments: true } },
} as const;

function mapAdminUser(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  suspended: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { courses?: number; enrollments?: number; quizAttempts?: number };
}) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    suspended: user.suspended,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    courseCount: user._count?.courses ?? 0,
    enrollmentCount: user._count?.enrollments ?? 0,
    quizAttemptCount: user._count?.quizAttempts ?? 0,
  };
}

function assertNotSelf(actorId: string, targetId: string, action: string) {
  if (actorId === targetId) {
    throw ApiError.forbidden(`You cannot ${action} your own account`);
  }
}

async function getUserOrThrow(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

async function assertLastAdminGuard(target: { id: string; role: Role }, action: string) {
  if (target.role !== "ADMIN") return;
  const adminCount = await prisma.user.count({
    where: { role: "ADMIN", suspended: false },
  });
  if (adminCount <= 1) {
    throw ApiError.forbidden(`Cannot ${action} the last active administrator`);
  }
}

async function assertCanModifyUser(actorId: string, target: { id: string; role: Role }) {
  assertNotSelf(actorId, target.id, "modify");
  if (target.role === "ADMIN") {
    throw ApiError.forbidden("Admin accounts cannot be modified through this panel");
  }
}

export async function listUsers(query: ListUsersQuery) {
  const where: Prisma.UserWhereInput = {};
  if (query.role) where.role = query.role;
  if (query.suspended !== undefined) where.suspended = query.suspended;
  if (query.search) {
    where.OR = [
      { email: { contains: query.search, mode: "insensitive" } },
      { firstName: { contains: query.search, mode: "insensitive" } },
      { lastName: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const orderBy = { [query.sortBy]: query.sortOrder } as Prisma.UserOrderByWithRelationInput;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: query.limit,
      orderBy,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        emailVerified: true,
        suspended: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { courses: true, enrollments: true, quizAttempts: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(mapAdminUser),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getUserDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      emailVerified: true,
      suspended: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { courses: true, enrollments: true, quizAttempts: true } },
      courses: {
        take: 10,
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, slug: true, status: true, deleteStatus: true },
      },
      enrollments: {
        take: 10,
        orderBy: { enrolledAt: "desc" },
        include: {
          course: { select: { id: true, title: true, slug: true } },
        },
      },
    },
  });

  if (!user) throw ApiError.notFound("User not found");

  return {
    ...mapAdminUser(user),
    courses: user.courses,
    recentEnrollments: user.enrollments.map((e) => ({
      id: e.id,
      enrolledAt: e.enrolledAt.toISOString(),
      progress: e.progressPercentage,
      completed: e.completed,
      course: e.course,
    })),
  };
}

async function createInstituteUser(
  actorId: string,
  input: { firstName: string; lastName: string; email: string; password: string },
  role: "STUDENT" | "TEACHER" | "ADMIN",
) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict("Email already registered", "EMAIL_EXISTS");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: passwordHash,
      role,
      emailVerified: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      emailVerified: true,
      suspended: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { courses: true, enrollments: true, quizAttempts: true } },
    },
  });

  await logActivity({
    type: "USER_CREATED",
    userId: actorId,
    metadata: { targetUserId: user.id, role, email: user.email },
  });

  return user;
}

export async function createStudent(actorId: string, input: CreateStudentInput) {
  const user = await createInstituteUser(actorId, input, "STUDENT");

  if (input.batchId) {
    const { addStudentsToBatch } = await import("../batches/batches.service.js");
    await addStudentsToBatch(input.batchId, [user.id], actorId);
  }

  if (input.courseId) {
    const { assignCourseToStudent } = await import("../course-access/course-access.service.js");
    await assignCourseToStudent(actorId, {
      studentId: user.id,
      courseId: input.courseId,
      accessType: "ADMIN_ASSIGNED",
    });
  }

  if (input.feePlan) {
    const { createFeePlan } = await import("../fees/fees.service.js");
    await createFeePlan({
      studentId: user.id,
      courseId: input.courseId ?? null,
      batchId: input.batchId ?? null,
      totalAmount: input.feePlan.totalAmount,
      dueDate: input.feePlan.dueDate,
    });
  }

  const delivery = await notifyAccountCredentials({
    actorId,
    userId: user.id,
    firstName: user.firstName,
    email: user.email,
    password: input.password,
    role: "STUDENT",
  });

  return { user: mapAdminUser(user), credentialsDelivered: delivery };
}

export async function createTeacher(actorId: string, input: CreateTeacherInput) {
  const user = await createInstituteUser(actorId, input, "TEACHER");

  if (input.batchId) {
    const batch = await prisma.batch.findUnique({ where: { id: input.batchId } });
    if (!batch) throw ApiError.badRequest("Batch not found");
    await prisma.batch.update({
      where: { id: input.batchId },
      data: { teacherId: user.id },
    });
  }

  if (input.salary) {
    const { createSalary } = await import("../teacher-salary/teacher-salary.service.js");
    await createSalary({
      teacherId: user.id,
      month: input.salary.month,
      year: input.salary.year,
      baseSalary: input.salary.baseSalary,
      bonus: input.salary.bonus,
      deductions: input.salary.deductions,
    });
  }

  const delivery = await notifyAccountCredentials({
    actorId,
    userId: user.id,
    firstName: user.firstName,
    email: user.email,
    password: input.password,
    role: "TEACHER",
  });

  return { user: mapAdminUser(user), credentialsDelivered: delivery };
}

export async function createAdmin(actorId: string, input: CreateAdminInput) {
  const user = await createInstituteUser(actorId, input, "ADMIN");

  const delivery = await notifyAccountCredentials({
    actorId,
    userId: user.id,
    firstName: user.firstName,
    email: user.email,
    password: input.password,
    role: "ADMIN",
  });

  return { user: mapAdminUser(user), credentialsDelivered: delivery };
}

export async function changeUserRole(actorId: string, userId: string, input: ChangeRoleInput) {
  const target = await getUserOrThrow(userId);
  assertNotSelf(actorId, target.id, "change the role of");

  if (target.role === input.role) {
    throw ApiError.badRequest(`User is already a ${input.role.toLowerCase()}`);
  }

  if (target.role === "ADMIN" && input.role !== "ADMIN") {
    await assertLastAdminGuard(target, "demote");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: input.role },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      emailVerified: true,
      suspended: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { courses: true, enrollments: true, quizAttempts: true } },
    },
  });

  await logActivity({
    type: "USER_ROLE_CHANGED",
    userId: actorId,
    metadata: {
      targetUserId: userId,
      previousRole: target.role,
      newRole: input.role,
    },
  });

  return mapAdminUser(user);
}

export async function suspendUser(actorId: string, userId: string, input: SuspendUserInput) {
  const target = await getUserOrThrow(userId);
  await assertCanModifyUser(actorId, target);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { suspended: input.suspended },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      emailVerified: true,
      suspended: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { courses: true, enrollments: true, quizAttempts: true } },
    },
  });

  if (input.suspended) {
    await logActivity({
      type: "USER_SUSPENDED",
      userId: actorId,
      metadata: { targetUserId: userId },
    });
  }

  return mapAdminUser(user);
}

export async function deleteUser(actorId: string, userId: string) {
  const target = await getUserOrThrow(userId);
  await assertCanModifyUser(actorId, target);

  if (target.role === "TEACHER") {
    const courseCount = await prisma.course.count({ where: { teacherId: userId } });
    if (courseCount > 0) {
      throw ApiError.conflict(
        "Cannot delete teacher with active courses. Reassign or delete courses first.",
      );
    }
  }

  await prisma.user.delete({ where: { id: userId } });
  return { message: "User deleted successfully" };
}

export async function resetUserPassword(
  actorId: string,
  userId: string,
  input: ResetPasswordInput,
) {
  const target = await getUserOrThrow(userId);
  await assertCanModifyUser(actorId, target);

  const passwordHash = await hashPassword(input.password);
  await prisma.user.update({
    where: { id: userId },
    data: { password: passwordHash },
  });

  return { message: "Password reset successfully" };
}

export async function listAdminCourses(query: ListAdminCoursesQuery) {
  const where: Prisma.CourseWhereInput = { ...courseNotDeletedFilter() };
  if (query.status) where.status = query.status;
  if (query.deleteStatus) where.deleteStatus = query.deleteStatus;
  if (query.teacherId) where.teacherId = query.teacherId;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const orderBy = { [query.sortBy]: query.sortOrder } as Prisma.CourseOrderByWithRelationInput;

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: query.limit,
      orderBy,
      include: courseInclude,
    }),
    prisma.course.count({ where }),
  ]);

  return {
    courses: courses.map((c) => ({
      ...mapCourse(c),
      enrollmentCount: c._count.enrollments,
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getCourseAnalytics(courseId: string) {
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: courseId }, { slug: courseId }] },
    include: {
      teacher: { select: teacherSelect },
      modules: { include: { lessons: { include: { quizzes: true } } } },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) throw ApiError.notFound("Course not found");

  const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const quizIds = course.modules.flatMap((m) => m.lessons.flatMap((l) => l.quizzes.map((q) => q.id)));

  const [completedEnrollments, avgProgress, quizAttempts, recentEnrollments] = await Promise.all([
    prisma.enrollment.count({ where: { courseId: course.id, completed: true } }),
    prisma.enrollment.aggregate({
      where: { courseId: course.id },
      _avg: { progressPercentage: true },
    }),
    quizIds.length
      ? prisma.quizAttempt.count({ where: { quizId: { in: quizIds } } })
      : Promise.resolve(0),
    prisma.enrollment.findMany({
      where: { courseId: course.id },
      take: 5,
      orderBy: { enrolledAt: "desc" },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  return {
    course: {
      ...mapCourse(course),
      enrollmentCount: course._count.enrollments,
      lessonCount: lessonIds.length,
      quizCount: quizIds.length,
    },
    analytics: {
      totalEnrollments: course._count.enrollments,
      completedEnrollments,
      averageProgress: Math.round((avgProgress._avg.progressPercentage ?? 0) * 10) / 10,
      quizAttempts,
    },
    teacher: course.teacher
      ? {
          id: course.teacher.id,
          name: `${course.teacher.firstName} ${course.teacher.lastName}`.trim(),
          email: course.teacher.email,
        }
      : null,
    recentEnrollments: recentEnrollments.map((e) => ({
      id: e.id,
      enrolledAt: e.enrolledAt.toISOString(),
      progress: e.progressPercentage,
      student: {
        id: e.student.id,
        name: `${e.student.firstName} ${e.student.lastName}`.trim(),
        email: e.student.email,
      },
    })),
  };
}

export async function adminPublishCourse(adminId: string, courseId: string, approved: boolean) {
  if (approved) {
    return coursesService.adminApproveCourse(adminId, courseId);
  }
  return coursesService.adminUnpublishCourse(adminId, courseId);
}

export async function adminRejectCourse(adminId: string, courseId: string, reason?: string) {
  return coursesService.adminRejectCourse(adminId, courseId, reason);
}

export async function adminArchiveCourse(adminId: string, courseId: string) {
  return coursesService.adminArchiveCourse(adminId, courseId);
}

export async function adminDeleteCourse(adminId: string, courseId: string) {
  return coursesService.approveDeleteRequest(adminId, "course", courseId);
}

export async function getReviewQueue() {
  return coursesService.getReviewQueue();
}

export async function getPendingDeleteRequests() {
  return coursesService.getPendingDeleteRequests();
}

export async function approveDeleteRequest(
  adminId: string,
  entityType: "course" | "module" | "lesson" | "quiz",
  entityId: string,
) {
  return coursesService.approveDeleteRequest(adminId, entityType, entityId);
}

export async function rejectDeleteRequest(
  entityType: "course" | "module" | "lesson" | "quiz",
  entityId: string,
) {
  return coursesService.rejectDeleteRequest(entityType, entityId);
}

export async function listActivity(query: ListActivityQuery) {
  const where: Prisma.ActivityLogWhereInput = {};
  if (query.type) where.type = query.type;

  const skip = (query.page - 1) * query.limit;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    activities: logs.map((log) => {
      const userName = log.user
        ? `${log.user.firstName} ${log.user.lastName}`.trim()
        : undefined;
      const meta = (log.metadata ?? {}) as Record<string, unknown>;
      return {
        id: log.id,
        type: log.type,
        message: activityMessage(log.type, {
          userName: userName ?? (meta.email as string | undefined),
          courseTitle: log.course?.title ?? (meta.title as string | undefined),
          role: meta.newRole as string | undefined,
          score: meta.score as number | undefined,
        }),
        timestamp: log.createdAt.toISOString(),
        user: log.user
          ? {
              id: log.user.id,
              name: userName!,
              email: log.user.email,
            }
          : null,
        course: log.course,
        metadata: log.metadata,
      };
    }),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getPlatformStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalStudents,
    totalTeachers,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    activeUsers,
    pendingModeration,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT", suspended: false } }),
    prisma.user.count({ where: { role: "TEACHER", suspended: false } }),
    prisma.course.count({ where: { deleteStatus: "ACTIVE", status: { not: "ARCHIVED" } } }),
    prisma.course.count({ where: { status: "APPROVED", deleteStatus: "ACTIVE" } }),
    prisma.enrollment.count(),
    prisma.user.count({
      where: {
        suspended: false,
        OR: [{ lastLoginAt: { gte: thirtyDaysAgo } }, { updatedAt: { gte: thirtyDaysAgo } }],
      },
    }),
    prisma.course.count({ where: { status: "UNDER_REVIEW", deleteStatus: "ACTIVE" } }),
  ]);

  return {
    totalStudents,
    totalTeachers,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    activeUsers,
    pendingModeration,
  };
}

export async function getStudentGrowth(days = 90) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const students = await prisma.user.findMany({
    where: { role: "STUDENT", createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const s of students) {
    const key = s.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  const series = Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
  const total = students.length;

  return { series, total, days };
}

export async function listAdminResources() {
  const { listAdminResources: list } = await import("../resources/resources.service.js");
  return list();
}

export async function adminRemoveResource(adminId: string, resourceId: string) {
  const { adminRemoveResource: remove } = await import("../resources/resources.service.js");
  return remove(adminId, resourceId);
}

export async function adminRestoreResource(resourceId: string) {
  const { adminRestoreResource: restore } = await import("../resources/resources.service.js");
  return restore(resourceId);
}

export async function listAdminCertificates() {
  const { listAdminCertificates: list } = await import("../certificates/certificates.service.js");
  return list();
}

export async function streamCertificatePdfAdmin(
  res: import("express").Response,
  certificateId: string,
  adminId: string,
) {
  const { streamCertificatePdfAdmin: stream } = await import("../certificates/certificates.service.js");
  return stream(res, certificateId, adminId);
}
