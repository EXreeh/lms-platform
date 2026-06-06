import type { EntityStatus, Role } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { activeEntityFilter } from "../courses/courses.helpers.js";
import { logActivity } from "../admin/activity.service.js";
import { logAction } from "../../utils/logger.js";
import { mapResource } from "./resources.mapper.js";
import type { CreateResourceInput, UpdateResourceInput } from "./resources.validation.js";

const uploaderSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

async function getCourseForResource(courseId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deleteStatus: { not: "DELETED" } },
  });
  if (!course) throw ApiError.notFound("Course not found");
  return course;
}

function canManageCourse(userId: string, role: Role, teacherId: string): boolean {
  return role === "ADMIN" || (role === "TEACHER" && userId === teacherId);
}

export async function createResource(userId: string, role: Role, input: CreateResourceInput) {
  const course = await getCourseForResource(input.courseId);
  if (!canManageCourse(userId, role, course.teacherId)) {
    throw ApiError.forbidden("You cannot add resources to this course");
  }

  if (input.lessonId) {
    const lesson = await prisma.lesson.findFirst({
      where: { id: input.lessonId, deleteStatus: "ACTIVE", module: { courseId: course.id } },
    });
    if (!lesson) throw ApiError.badRequest("Lesson not found in this course");
  }

  const resource = await prisma.resource.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      type: input.type,
      url: input.url,
      fileName: input.fileName ?? null,
      mimeType: input.mimeType ?? null,
      fileSize: input.fileSize ?? null,
      storageProvider: input.storageProvider ?? "local",
      courseId: course.id,
      lessonId: input.lessonId ?? null,
      uploadedById: userId,
    },
    include: { uploadedBy: { select: uploaderSelect } },
  });

  await logActivity({
    type: "RESOURCE_CREATED",
    userId,
    courseId: course.id,
    metadata: { resourceId: resource.id, title: resource.title, type: resource.type },
  });
  logAction("[Resource] created", { userId, resourceId: resource.id, courseId: course.id });

  return mapResource(resource);
}

export async function updateResource(
  userId: string,
  role: Role,
  resourceId: string,
  input: UpdateResourceInput,
) {
  const existing = await prisma.resource.findFirst({
    where: { id: resourceId, deleteStatus: { not: "DELETED" } },
    include: { course: true },
  });
  if (!existing) throw ApiError.notFound("Resource not found");
  if (!canManageCourse(userId, role, existing.course.teacherId)) {
    throw ApiError.forbidden();
  }

  const resource = await prisma.resource.update({
    where: { id: resourceId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description ?? null }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.url !== undefined && { url: input.url }),
      ...(input.fileName !== undefined && { fileName: input.fileName ?? null }),
      ...(input.mimeType !== undefined && { mimeType: input.mimeType ?? null }),
      ...(input.fileSize !== undefined && { fileSize: input.fileSize ?? null }),
      ...(input.storageProvider !== undefined && { storageProvider: input.storageProvider }),
    },
    include: { uploadedBy: { select: uploaderSelect } },
  });

  return mapResource(resource);
}

export async function deleteResource(userId: string, role: Role, resourceId: string) {
  const existing = await prisma.resource.findFirst({
    where: { id: resourceId, deleteStatus: { not: "DELETED" } },
    include: { course: true },
  });
  if (!existing) throw ApiError.notFound("Resource not found");
  if (!canManageCourse(userId, role, existing.course.teacherId)) {
    throw ApiError.forbidden();
  }

  if (role === "ADMIN") {
    await prisma.resource.update({
      where: { id: resourceId },
      data: { deleteStatus: "DELETED" },
    });
    return { message: "Resource removed", pendingApproval: false };
  }

  await prisma.resource.update({
    where: { id: resourceId },
    data: { deleteStatus: "PENDING_DELETE" },
  });
  await logActivity({
    type: "DELETE_REQUESTED",
    userId,
    courseId: existing.courseId,
    metadata: { entityType: "resource", entityId: resourceId, title: existing.title },
  });

  return { message: "Delete request submitted for admin approval", pendingApproval: true };
}

const MANAGE_DELETE_STATUSES: EntityStatus[] = ["ACTIVE", "PENDING_DELETE"];

export async function listCourseResources(
  courseId: string,
  visibility: "student" | "manage" | "admin",
) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deleteStatus: { not: "DELETED" } },
  });
  if (!course) throw ApiError.notFound("Course not found");

  const deleteFilter =
    visibility === "student"
      ? { deleteStatus: "ACTIVE" as const }
      : visibility === "manage"
        ? { deleteStatus: { in: MANAGE_DELETE_STATUSES } }
        : { deleteStatus: { not: "DELETED" as const } };

  const resources = await prisma.resource.findMany({
    where: { courseId, lessonId: null, ...deleteFilter },
    include: { uploadedBy: { select: uploaderSelect } },
    orderBy: { createdAt: "desc" },
  });

  return resources.map(mapResource);
}

export async function listLessonResources(
  lessonId: string,
  visibility: "student" | "manage" | "admin",
) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, ...activeEntityFilter() },
    include: { module: { include: { course: true } } },
  });
  if (!lesson) throw ApiError.notFound("Lesson not found");

  const deleteFilter =
    visibility === "student"
      ? { deleteStatus: "ACTIVE" as const }
      : visibility === "manage"
        ? { deleteStatus: { in: MANAGE_DELETE_STATUSES } }
        : { deleteStatus: { not: "DELETED" as const } };

  const resources = await prisma.resource.findMany({
    where: { lessonId, ...deleteFilter },
    include: { uploadedBy: { select: uploaderSelect } },
    orderBy: { createdAt: "desc" },
  });

  return resources.map(mapResource);
}

export async function listTeacherResources(userId: string, role: Role) {
  const where =
    role === "ADMIN"
      ? { deleteStatus: { not: "DELETED" as const } }
      : {
          deleteStatus: { not: "DELETED" as const },
          course: { teacherId: userId },
        };

  const resources = await prisma.resource.findMany({
    where,
    include: {
      uploadedBy: { select: uploaderSelect },
      course: { select: { id: true, title: true, slug: true } },
      lesson: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return resources.map((r) => ({
    ...mapResource(r),
    course: r.course,
    lesson: r.lesson,
  }));
}

export async function listAdminResources() {
  const resources = await prisma.resource.findMany({
    where: { deleteStatus: { not: "DELETED" } },
    include: {
      uploadedBy: { select: uploaderSelect },
      course: { select: { id: true, title: true, slug: true, status: true } },
      lesson: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return resources.map((r) => ({
    ...mapResource(r),
    course: r.course,
    lesson: r.lesson,
  }));
}

export async function adminRemoveResource(adminId: string, resourceId: string) {
  const existing = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!existing) throw ApiError.notFound("Resource not found");

  await prisma.resource.update({
    where: { id: resourceId },
    data: { deleteStatus: "DELETED" },
  });

  await logActivity({
    type: "RESOURCE_REMOVED",
    userId: adminId,
    courseId: existing.courseId,
    metadata: { resourceId, title: existing.title },
  });

  return { message: "Resource removed" };
}

export async function listCourseResourcesForStudent(studentId: string, courseId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, status: "APPROVED", deleteStatus: "ACTIVE" },
  });
  if (!course) throw ApiError.notFound("Course not found");

  const { assertStudentCourseAccess } = await import(
    "../course-access/course-access.service.js"
  );
  await assertStudentCourseAccess(studentId, courseId);

  return listCourseResources(courseId, "student");
}

export async function listLessonResourcesForStudent(studentId: string, lessonId: string) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, ...activeEntityFilter() },
    include: { module: { include: { course: true } } },
  });
  if (!lesson) throw ApiError.notFound("Lesson not found");
  if (lesson.module.course.status !== "APPROVED") {
    throw ApiError.notFound("Course not available");
  }

  const { assertStudentCourseAccess } = await import(
    "../course-access/course-access.service.js"
  );
  await assertStudentCourseAccess(studentId, lesson.module.courseId);

  return listLessonResources(lessonId, "student");
}

export async function listStudentEnrolledResources(studentId: string) {
  const { getAssignedCoursesForStudent } = await import(
    "../course-access/course-access.service.js"
  );
  const assigned = await getAssignedCoursesForStudent(studentId);
  const courseIds = assigned.filter((a) => a.accessActive).map((a) => a.course.id);
  if (courseIds.length === 0) return [];

  const resources = await prisma.resource.findMany({
    where: {
      courseId: { in: courseIds },
      deleteStatus: "ACTIVE",
    },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      lesson: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return resources.map((r) => ({
    ...mapResource(r),
    course: r.course,
    lesson: r.lesson,
  }));
}

export async function adminRestoreResource(resourceId: string) {
  const existing = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!existing) throw ApiError.notFound("Resource not found");

  await prisma.resource.update({
    where: { id: resourceId },
    data: { deleteStatus: "ACTIVE" },
  });

  return { message: "Resource restored" };
}
