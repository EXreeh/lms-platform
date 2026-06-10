import type { Prisma, Role } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { slugify, uniqueSlug } from "../../utils/slug.js";
import { logActivity } from "../admin/activity.service.js";
import {
  assertTeacherOwnsOrAdmin,
  assertCanRequestDelete,
  canSubmitForReview,
  canTeacherEditCourse,
  courseNotDeletedFilter,
  entityFilter,
  getActiveCourseWhereClause,
  isCatalogVisible,
} from "./courses.helpers.js";
import { mapCourse } from "./courses.mapper.js";
import { logAction } from "../../utils/logger.js";
import type {
  CreateCourseInput,
  UpdateCourseInput,
  ListCoursesQuery,
} from "./courses.validation.js";

const teacherSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

function buildCourseInclude(visibility: "public" | "manage" | "admin") {
  const filter = entityFilter(visibility);
  return {
    teacher: { select: teacherSelect },
    modules: {
      where: filter,
      orderBy: { order: "asc" as const },
      include: {
        lessons: {
          where: filter,
          orderBy: { order: "asc" as const },
        },
      },
    },
  };
}

function canManageCourse(userId: string, role: Role, teacherId: string): boolean {
  return assertTeacherOwnsOrAdmin(userId, role, teacherId);
}

async function getCourseOrThrow(
  idOrSlug: string,
  visibility: "public" | "manage" | "admin" = "manage",
) {
  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      ...courseNotDeletedFilter(),
    },
    include: buildCourseInclude(visibility),
  });

  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  return course;
}

function assertEditable(course: { status: string }, role: Role) {
  if (role === "ADMIN") return;
  if (!canTeacherEditCourse(course.status as import("@lms/database").CourseStatus)) {
    throw ApiError.forbidden("Course is locked while under review or archived");
  }
}

export async function createCourse(userId: string, role: Role, input: CreateCourseInput) {
  if (role !== "TEACHER" && role !== "ADMIN") {
    throw ApiError.forbidden("Only teachers and admins can create courses");
  }

  const slug = await uniqueSlug(input.title, async (s) => {
    const found = await prisma.course.findUnique({ where: { slug: s } });
    return Boolean(found);
  });

  const course = await prisma.course.create({
    data: {
      title: input.title,
      slug,
      description: input.description,
      thumbnail: input.thumbnail
        ? (await import("../../services/storage/video-url.helpers.js")).resolveCourseThumbnailUrl(
            input.thumbnail,
          )
        : null,
      thumbnailFileName: input.thumbnailFileName ?? null,
      price: input.price,
      category: input.category,
      level: input.level,
      teacherId: userId,
      status: role === "ADMIN" ? "APPROVED" : "DRAFT",
    },
    include: buildCourseInclude("manage"),
  });

  await logActivity({
    type: "COURSE_CREATED",
    userId,
    courseId: course.id,
    metadata: { title: course.title },
  });

  return mapCourse(course);
}

export async function updateCourse(
  userId: string,
  role: Role,
  idOrSlug: string,
  input: UpdateCourseInput,
) {
  const existing = await getCourseOrThrow(idOrSlug);
  if (!canManageCourse(userId, role, existing.teacherId)) {
    throw ApiError.forbidden("You do not have permission to edit this course");
  }
  assertEditable(existing, role);

  let slug = existing.slug;
  if (input.title && slugify(input.title) !== slugify(existing.title)) {
    slug = await uniqueSlug(input.title, async (s) => {
      const found = await prisma.course.findFirst({
        where: { slug: s, NOT: { id: existing.id } },
      });
      return Boolean(found);
    });
  }

  const course = await prisma.course.update({
    where: { id: existing.id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.thumbnail !== undefined && {
        thumbnail: input.thumbnail
          ? (await import("../../services/storage/video-url.helpers.js")).resolveCourseThumbnailUrl(
              input.thumbnail,
            )
          : null,
      }),
      ...(input.thumbnailFileName !== undefined && {
        thumbnailFileName: input.thumbnailFileName || null,
      }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.level !== undefined && { level: input.level }),
      slug,
    },
    include: buildCourseInclude("manage"),
  });

  await logActivity({
    type: "COURSE_UPDATED",
    userId,
    courseId: course.id,
    metadata: { title: course.title },
  });

  return mapCourse(course);
}

export async function submitCourseForReview(userId: string, role: Role, idOrSlug: string) {
  const existing = await getCourseOrThrow(idOrSlug);
  if (!canManageCourse(userId, role, existing.teacherId)) {
    throw ApiError.forbidden();
  }
  if (role !== "ADMIN" && !canSubmitForReview(existing.status)) {
    throw ApiError.badRequest("Only draft or rejected courses can be submitted for review");
  }

  const lessonCount = await prisma.lesson.count({
    where: {
      deleteStatus: "ACTIVE",
      module: { courseId: existing.id, deleteStatus: "ACTIVE" },
    },
  });

  if (lessonCount === 0) {
    throw ApiError.badRequest("Add at least one lesson before submitting for review");
  }

  const course = await prisma.course.update({
    where: { id: existing.id },
    data: { status: "UNDER_REVIEW", rejectionReason: null },
    include: buildCourseInclude("manage"),
  });

  await logActivity({
    type: "COURSE_SUBMITTED",
    userId,
    courseId: course.id,
    metadata: { title: course.title },
  });

  logAction("course.submit_review", { userId, courseId: course.id, title: course.title });

  return mapCourse(course);
}

export async function deleteCourse(userId: string, role: Role, idOrSlug: string) {
  const existing = await getCourseOrThrow(idOrSlug);
  if (!canManageCourse(userId, role, existing.teacherId)) {
    throw ApiError.forbidden("You do not have permission to delete this course");
  }

  if (role === "ADMIN") {
    await prisma.$transaction([
      prisma.course.update({
        where: { id: existing.id },
        data: { deleteStatus: "DELETED", status: "ARCHIVED" },
      }),
      prisma.studentCourseAccess.updateMany({
        where: { courseId: existing.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { message: "Course deleted", pendingApproval: false };
  }

  await prisma.course.update({
    where: { id: existing.id },
    data: { deleteStatus: "PENDING_DELETE" },
  });

  await logActivity({
    type: "DELETE_REQUESTED",
    userId,
    courseId: existing.id,
    metadata: { entityType: "course", title: existing.title },
  });

  logAction("delete.request", { userId, entityType: "course", entityId: existing.id });

  return { message: "Delete request submitted for admin approval", pendingApproval: true };
}

export async function listCourses(
  userId: string | undefined,
  role: Role | undefined,
  query: ListCoursesQuery,
) {
  const where: Prisma.CourseWhereInput =
    role === "ADMIN" ? { ...courseNotDeletedFilter() } : { ...getActiveCourseWhereClause() };

  if (query.mine && userId && role === "TEACHER") {
    where.teacherId = userId;
    where.deleteStatus = { in: ["ACTIVE", "PENDING_DELETE"] };
    if (query.status) where.status = query.status;
  } else if (role === "ADMIN" && query.mine) {
    where.teacherId = userId;
  } else if (role === "TEACHER" && !query.mine) {
    where.status = "APPROVED";
  } else if (role === "ADMIN") {
    if (query.status) where.status = query.status;
  } else if (role === "STUDENT" && userId) {
    where.status = "APPROVED";
    try {
      const access = await prisma.studentCourseAccess.findMany({
        where: { studentId: userId, revokedAt: null },
        select: { courseId: true },
      });
      const ids = access.map((a) => a.courseId);
      if (ids.length === 0) return [];
      where.id = { in: ids };
    } catch {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId },
        select: { courseId: true },
      });
      const ids = enrollments.map((e) => e.courseId);
      if (ids.length === 0) return [];
      where.id = { in: ids };
    }
  } else {
    where.status = "APPROVED";
    where.deleteStatus = "ACTIVE";
  }

  if (query.category) {
    where.category = { equals: query.category, mode: "insensitive" };
  }
  if (query.level) where.level = query.level;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const visibility = query.mine ? "manage" : "public";
  const courses = await prisma.course.findMany({
    where,
    include: {
      teacher: { select: teacherSelect },
      modules: {
        where: entityFilter(visibility),
        include: { lessons: { where: entityFilter(visibility) } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return courses.map((c) => ({
    ...mapCourse(c),
    isOwner: userId ? c.teacherId === userId : false,
  }));
}

export async function getCourse(idOrSlug: string, userId?: string, role?: Role) {
  const unavailable = await prisma.course.findFirst({
    where: {
      AND: [
        { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
        { OR: [{ deleteStatus: "DELETED" }, { status: "ARCHIVED" }] },
      ],
    },
    select: { id: true, deleteStatus: true, status: true },
  });
  if (
    unavailable &&
    (unavailable.deleteStatus === "DELETED" || (unavailable.status === "ARCHIVED" && role !== "ADMIN"))
  ) {
    throw ApiError.notFound("This course is no longer available.");
  }

  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      ...courseNotDeletedFilter(),
    },
    include: buildCourseInclude("manage"),
  });

  if (!course) throw ApiError.notFound("Course not found");

  const isOwner = userId ? course.teacherId === userId : false;
  const isAdmin = role === "ADMIN";
  const catalogVisible = isCatalogVisible(course.status, course.deleteStatus);

  if (!catalogVisible && !isAdmin && !isOwner) {
    if (role === "TEACHER") {
      const publicCourse = await prisma.course.findFirst({
        where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], status: "APPROVED", deleteStatus: "ACTIVE" },
        include: buildCourseInclude("public"),
      });
      if (publicCourse) {
        return { ...mapCourse(publicCourse, true), isOwner: false, readOnly: true };
      }
    }
    throw ApiError.notFound("Course not found");
  }

  const visibility = catalogVisible && !isOwner && !isAdmin ? "public" : "manage";
  const fullCourse =
    visibility === "public"
      ? await prisma.course.findFirstOrThrow({
          where: { id: course.id },
          include: buildCourseInclude("public"),
        })
      : course;

  const mapped = mapCourse(fullCourse, true);

  if (isAdmin) {
    return { ...mapped, adminPreview: true, canAccessLearn: true, isOwner: false, readOnly: false };
  }

  if (userId && role === "STUDENT") {
    const { getStudentCourseAccessFlags } = await import(
      "../course-access/course-access.service.js"
    );
    const flags = await getStudentCourseAccessFlags(userId, course.id, role);
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: userId, courseId: course.id } },
    });
    return {
      ...mapped,
      assigned: flags.assigned,
      accessLabel: flags.accessLabel,
      enrolled: flags.canLearn,
      enrollmentProgress: enrollment?.progressPercentage,
      enrollmentCompleted: enrollment?.completed ?? false,
      isOwner: false,
      readOnly: true,
    };
  }

  return {
    ...mapped,
    isOwner,
    readOnly: role === "TEACHER" && !isOwner,
  };
}

/** @deprecated Admin-only — use adminApproveCourse instead */
export async function publishCourse(
  userId: string,
  role: Role,
  idOrSlug: string,
  published: boolean,
) {
  if (role !== "ADMIN") {
    throw ApiError.forbidden("Only administrators can publish courses");
  }
  if (!published) {
    return adminUnpublishCourse(userId, idOrSlug);
  }
  return adminApproveCourse(userId, idOrSlug);
}

export async function adminApproveCourse(userId: string, idOrSlug: string) {
  const existing = await getCourseOrThrow(idOrSlug, "admin");
  if (existing.status !== "UNDER_REVIEW" && existing.status !== "DRAFT") {
    throw ApiError.badRequest("Course is not pending approval");
  }

  const course = await prisma.course.update({
    where: { id: existing.id },
    data: { status: "APPROVED", deleteStatus: "ACTIVE" },
    include: buildCourseInclude("manage"),
  });

  await logActivity({
    type: "COURSE_APPROVED",
    userId,
    courseId: course.id,
    metadata: { title: course.title },
  });
  await logActivity({
    type: "COURSE_PUBLISHED",
    userId,
    courseId: course.id,
    metadata: { title: course.title },
  });

  return mapCourse(course);
}

export async function adminRejectCourse(userId: string, idOrSlug: string, reason?: string) {
  const existing = await getCourseOrThrow(idOrSlug, "admin");
  if (existing.status !== "UNDER_REVIEW") {
    throw ApiError.badRequest("Course is not under review");
  }
  if (!reason?.trim() || reason.trim().length < 10) {
    throw ApiError.badRequest("A rejection reason of at least 10 characters is required");
  }

  const course = await prisma.course.update({
    where: { id: existing.id },
    data: {
      status: "REJECTED",
      rejectionReason: reason?.trim() || null,
    },
    include: buildCourseInclude("manage"),
  });

  await logActivity({
    type: "COURSE_REJECTED",
    userId,
    courseId: course.id,
    metadata: { title: course.title, reason },
  });

  return mapCourse(course);
}

export async function adminUnpublishCourse(_userId: string, idOrSlug: string) {
  const existing = await getCourseOrThrow(idOrSlug, "admin");
  const course = await prisma.course.update({
    where: { id: existing.id },
    data: { status: "DRAFT" },
    include: buildCourseInclude("manage"),
  });
  return mapCourse(course);
}

export async function adminArchiveCourse(userId: string, idOrSlug: string) {
  const existing = await getCourseOrThrow(idOrSlug, "admin");
  const course = await prisma.$transaction(async (tx) => {
    await tx.studentCourseAccess.updateMany({
      where: { courseId: existing.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return tx.course.update({
      where: { id: existing.id },
      data: { status: "ARCHIVED" },
      include: buildCourseInclude("manage"),
    });
  });

  await logActivity({
    type: "COURSE_ARCHIVED",
    userId,
    courseId: course.id,
    metadata: { title: course.title },
  });

  return mapCourse(course);
}

async function requestEntityDelete(
  userId: string,
  role: Role,
  entityType: "module" | "lesson" | "quiz",
  entityId: string,
  courseId: string,
  title: string,
) {
  if (role === "ADMIN") {
    return false;
  }
  await logActivity({
    type: "DELETE_REQUESTED",
    userId,
    courseId,
    metadata: { entityType, entityId, title },
  });
  return true;
}

export async function createModule(
  userId: string,
  role: Role,
  courseId: string,
  input: { title: string; order?: number },
) {
  const course = await getCourseOrThrow(courseId);
  if (!canManageCourse(userId, role, course.teacherId)) throw ApiError.forbidden();
  assertEditable(course, role);

  const maxOrder = course.modules.reduce((max, m) => Math.max(max, m.order), -1);
  const order = input.order ?? maxOrder + 1;

  await prisma.module.create({
    data: { title: input.title, order, courseId: course.id },
  });

  return mapCourse(
    await prisma.course.findUniqueOrThrow({
      where: { id: course.id },
      include: buildCourseInclude("manage"),
    }),
    true,
  );
}

export async function createLesson(
  userId: string,
  role: Role,
  moduleId: string,
  input: {
    title: string;
    description?: string;
    videoUrl?: string;
    videoFileName?: string | null;
    videoMimeType?: string | null;
    videoSize?: number | null;
    videoStorageProvider?: string | null;
    videoStorageKey?: string | null;
    duration?: number;
    order?: number;
  },
) {
  const module = await prisma.module.findFirst({
    where: { id: moduleId, ...entityFilter("manage") },
    include: { lessons: { where: entityFilter("manage") }, course: true },
  });

  if (!module) throw ApiError.notFound("Module not found");
  if (!canManageCourse(userId, role, module.course.teacherId)) throw ApiError.forbidden();
  assertEditable(module.course, role);

  const maxOrder = module.lessons.reduce((max, l) => Math.max(max, l.order), -1);
  const order = input.order ?? maxOrder + 1;

  const { resolveVideoFieldsForSave } = await import(
    "../../services/storage/video-url.helpers.js"
  );
  console.log("[lessons] create payload video", {
    videoUrl: input.videoUrl,
    videoStorageProvider: input.videoStorageProvider,
    videoStorageKey: input.videoStorageKey,
  });

  const videoFields = resolveVideoFieldsForSave({
    videoUrl: input.videoUrl,
    videoStorageProvider: input.videoStorageProvider,
    videoStorageKey: input.videoStorageKey,
  });

  const lesson = await prisma.lesson.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      videoUrl: videoFields.videoUrl,
      videoFileName: input.videoFileName ?? null,
      videoMimeType: input.videoMimeType ?? null,
      videoSize: input.videoSize ?? null,
      videoStorageProvider: videoFields.videoStorageProvider,
      videoStorageKey: videoFields.videoStorageKey,
      duration: input.duration ?? 0,
      order,
      moduleId: module.id,
    },
  });

  console.log("[lessons] created", {
    lessonId: lesson.id,
    moduleId: module.id,
    storageKey: lesson.videoStorageKey,
    publicUrl: videoFields.videoUrl,
    videoUrl: lesson.videoUrl,
    videoMimeType: lesson.videoMimeType,
    videoStorageProvider: lesson.videoStorageProvider,
    videoStorageKey: lesson.videoStorageKey,
    videoFileName: lesson.videoFileName,
    videoSize: lesson.videoSize,
  });

  return mapCourse(
    await prisma.course.findUniqueOrThrow({
      where: { id: module.courseId },
      include: buildCourseInclude("manage"),
    }),
    true,
  );
}

export async function deleteModule(userId: string, role: Role, moduleId: string) {
  const module = await prisma.module.findFirst({
    where: { id: moduleId, ...entityFilter("manage") },
    include: { course: true },
  });

  if (!module) throw ApiError.notFound("Module not found");
  if (!canManageCourse(userId, role, module.course.teacherId)) throw ApiError.forbidden();
  assertCanRequestDelete(module.course, role);

  if (role === "ADMIN") {
    await prisma.module.update({ where: { id: moduleId }, data: { deleteStatus: "DELETED" } });
    logAction("delete.approved", { userId, entityType: "module", entityId: moduleId, byAdmin: true });
    return {
      course: mapCourse(
        await prisma.course.findUniqueOrThrow({
          where: { id: module.courseId },
          include: buildCourseInclude("manage"),
        }),
        true,
      ),
      pendingApproval: false,
      message: "Module deleted",
    };
  }

  await prisma.module.update({ where: { id: moduleId }, data: { deleteStatus: "PENDING_DELETE" } });
  await requestEntityDelete(userId, role, "module", moduleId, module.courseId, module.title);
  logAction("delete.request", { userId, entityType: "module", entityId: moduleId, courseId: module.courseId });

  return {
    course: mapCourse(
      await prisma.course.findUniqueOrThrow({
        where: { id: module.courseId },
        include: buildCourseInclude("manage"),
      }),
      true,
    ),
    pendingApproval: true,
    message: "Delete request submitted for admin approval",
  };
}

export async function deleteLesson(userId: string, role: Role, lessonId: string) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, ...entityFilter("manage") },
    include: { module: { include: { course: true } } },
  });

  if (!lesson) throw ApiError.notFound("Lesson not found");
  if (!canManageCourse(userId, role, lesson.module.course.teacherId)) throw ApiError.forbidden();
  assertCanRequestDelete(lesson.module.course, role);

  if (role === "ADMIN") {
    await prisma.lesson.update({ where: { id: lessonId }, data: { deleteStatus: "DELETED" } });
    logAction("delete.approved", { userId, entityType: "lesson", entityId: lessonId, byAdmin: true });
    return {
      course: mapCourse(
        await prisma.course.findUniqueOrThrow({
          where: { id: lesson.module.courseId },
          include: buildCourseInclude("manage"),
        }),
        true,
      ),
      pendingApproval: false,
      message: "Lesson deleted",
    };
  }

  await prisma.lesson.update({ where: { id: lessonId }, data: { deleteStatus: "PENDING_DELETE" } });
  await requestEntityDelete(userId, role, "lesson", lessonId, lesson.module.courseId, lesson.title);
  logAction("delete.request", { userId, entityType: "lesson", entityId: lessonId, courseId: lesson.module.courseId });

  return {
    course: mapCourse(
      await prisma.course.findUniqueOrThrow({
        where: { id: lesson.module.courseId },
        include: buildCourseInclude("manage"),
      }),
      true,
    ),
    pendingApproval: true,
    message: "Delete request submitted for admin approval",
  };
}

export async function getCategories() {
  const rows = await prisma.course.findMany({
    where: { status: "APPROVED", ...getActiveCourseWhereClause() },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
}

export async function enrollInCourse(studentId: string, idOrSlug: string) {
  const { enrollInCourse: enroll } = await import("../learning/learning.service.js");
  return enroll(studentId, idOrSlug);
}

export async function reorderModules(
  userId: string,
  role: Role,
  courseId: string,
  ids: string[],
) {
  const course = await getCourseOrThrow(courseId);
  if (!canManageCourse(userId, role, course.teacherId)) throw ApiError.forbidden();
  assertEditable(course, role);

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.module.update({ where: { id, courseId: course.id }, data: { order: index } }),
    ),
  );

  return mapCourse(
    await prisma.course.findUniqueOrThrow({ where: { id: course.id }, include: buildCourseInclude("manage") }),
    true,
  );
}

export async function reorderLessons(
  userId: string,
  role: Role,
  moduleId: string,
  ids: string[],
) {
  const module = await prisma.module.findFirst({
    where: { id: moduleId, ...entityFilter("manage") },
    include: { course: true },
  });

  if (!module) throw ApiError.notFound("Module not found");
  if (!canManageCourse(userId, role, module.course.teacherId)) throw ApiError.forbidden();
  assertEditable(module.course, role);

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.lesson.update({ where: { id, moduleId: module.id }, data: { order: index } }),
    ),
  );

  return mapCourse(
    await prisma.course.findUniqueOrThrow({
      where: { id: module.courseId },
      include: buildCourseInclude("manage"),
    }),
    true,
  );
}

export async function updateModule(
  userId: string,
  role: Role,
  moduleId: string,
  input: { title?: string; order?: number },
) {
  const module = await prisma.module.findFirst({
    where: { id: moduleId, ...entityFilter("manage") },
    include: { course: true },
  });

  if (!module) throw ApiError.notFound("Module not found");
  if (!canManageCourse(userId, role, module.course.teacherId)) throw ApiError.forbidden();
  assertEditable(module.course, role);

  await prisma.module.update({ where: { id: moduleId }, data: input });

  return mapCourse(
    await prisma.course.findUniqueOrThrow({
      where: { id: module.courseId },
      include: buildCourseInclude("manage"),
    }),
    true,
  );
}

export async function updateLesson(
  userId: string,
  role: Role,
  lessonId: string,
  input: {
    title?: string;
    description?: string;
    videoUrl?: string;
    videoFileName?: string | null;
    videoMimeType?: string | null;
    videoSize?: number | null;
    videoStorageProvider?: string | null;
    videoStorageKey?: string | null;
    duration?: number;
    order?: number;
  },
) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, ...entityFilter("manage") },
    include: { module: { include: { course: true } } },
  });

  if (!lesson) throw ApiError.notFound("Lesson not found");
  if (!canManageCourse(userId, role, lesson.module.course.teacherId)) throw ApiError.forbidden();
  assertEditable(lesson.module.course, role);

  const hasVideoUpdate =
    input.videoUrl !== undefined ||
    input.videoStorageKey !== undefined ||
    input.videoStorageProvider !== undefined;

  let resolvedVideo:
    | { videoUrl: string | null; videoStorageKey: string | null; videoStorageProvider: string | null }
    | undefined;
  if (hasVideoUpdate) {
    const { resolveVideoFieldsForSave } = await import(
      "../../services/storage/video-url.helpers.js"
    );
    resolvedVideo = resolveVideoFieldsForSave({
      videoUrl: input.videoUrl !== undefined ? input.videoUrl : lesson.videoUrl,
      videoStorageProvider:
        input.videoStorageProvider !== undefined
          ? input.videoStorageProvider
          : lesson.videoStorageProvider,
      videoStorageKey:
        input.videoStorageKey !== undefined ? input.videoStorageKey : lesson.videoStorageKey,
    });
    console.log("[lessons] update payload video", {
      lessonId,
      inputVideoUrl: input.videoUrl,
      resolvedVideoUrl: resolvedVideo.videoUrl,
      videoStorageProvider: resolvedVideo.videoStorageProvider,
    });
  }

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(resolvedVideo && {
        videoUrl: resolvedVideo.videoUrl,
        videoStorageKey: resolvedVideo.videoStorageKey,
        videoStorageProvider: resolvedVideo.videoStorageProvider,
      }),
      ...(input.videoFileName !== undefined && { videoFileName: input.videoFileName }),
      ...(input.videoMimeType !== undefined && { videoMimeType: input.videoMimeType }),
      ...(input.videoSize !== undefined && { videoSize: input.videoSize }),
      ...(input.duration !== undefined && { duration: input.duration }),
      ...(input.order !== undefined && { order: input.order }),
    },
  });

  return mapCourse(
    await prisma.course.findUniqueOrThrow({
      where: { id: lesson.module.courseId },
      include: buildCourseInclude("manage"),
    }),
    true,
  );
}

export async function getReviewQueue() {
  const courses = await prisma.course.findMany({
    where: { status: "UNDER_REVIEW", ...courseNotDeletedFilter() },
    include: {
      teacher: { select: teacherSelect },
      modules: { include: { lessons: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { updatedAt: "asc" },
  });
  return courses.map((c) => ({ ...mapCourse(c), enrollmentCount: c._count.enrollments }));
}

export async function getPendingDeleteRequests() {
  const [courses, modules, lessons, quizzes] = await Promise.all([
    prisma.course.findMany({
      where: { deleteStatus: "PENDING_DELETE" },
      select: { id: true, title: true, slug: true, teacherId: true, updatedAt: true },
    }),
    prisma.module.findMany({
      where: { deleteStatus: "PENDING_DELETE" },
      select: { id: true, title: true, courseId: true, createdAt: true },
    }),
    prisma.lesson.findMany({
      where: { deleteStatus: "PENDING_DELETE" },
      select: { id: true, title: true, moduleId: true, createdAt: true },
    }),
    prisma.quiz.findMany({
      where: { deleteStatus: "PENDING_DELETE" },
      select: { id: true, title: true, lessonId: true, updatedAt: true },
    }),
  ]);

  return { courses, modules, lessons, quizzes };
}

export async function approveDeleteRequest(
  adminId: string,
  entityType: "course" | "module" | "lesson" | "quiz",
  entityId: string,
) {
  const data = { deleteStatus: "DELETED" as const };
  let courseId: string | undefined;

  switch (entityType) {
    case "course": {
      await prisma.$transaction([
        prisma.course.update({
          where: { id: entityId },
          data: { ...data, status: "ARCHIVED" },
        }),
        prisma.studentCourseAccess.updateMany({
          where: { courseId: entityId, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
      ]);
      courseId = entityId;
      break;
    }
    case "module": {
      const m = await prisma.module.update({ where: { id: entityId }, data });
      courseId = m.courseId;
      break;
    }
    case "lesson": {
      const l = await prisma.lesson.update({
        where: { id: entityId },
        data,
        include: { module: true },
      });
      courseId = l.module.courseId;
      break;
    }
    case "quiz": {
      const q = await prisma.quiz.update({
        where: { id: entityId },
        data,
        include: { lesson: { include: { module: true } } },
      });
      courseId = q.lesson.module.courseId;
      break;
    }
  }

  await logActivity({
    type: "DELETE_APPROVED",
    userId: adminId,
    courseId,
    metadata: { entityType, entityId },
  });

  return { message: "Delete request approved" };
}

export async function rejectDeleteRequest(
  entityType: "course" | "module" | "lesson" | "quiz",
  entityId: string,
) {
  switch (entityType) {
    case "course":
      await prisma.course.update({ where: { id: entityId }, data: { deleteStatus: "ACTIVE" } });
      break;
    case "module":
      await prisma.module.update({ where: { id: entityId }, data: { deleteStatus: "ACTIVE" } });
      break;
    case "lesson":
      await prisma.lesson.update({ where: { id: entityId }, data: { deleteStatus: "ACTIVE" } });
      break;
    case "quiz":
      await prisma.quiz.update({ where: { id: entityId }, data: { deleteStatus: "ACTIVE" } });
      break;
  }
  return { message: "Delete request rejected" };
}
