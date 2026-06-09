import type { Course, CourseLevel, Lesson, Module, User } from "@lms/database";
import type { Decimal } from "@prisma/client/runtime/library";
import {
  resolveCourseThumbnailUrl,
  resolveLessonVideoUrl,
} from "../../services/storage/video-url.helpers.js";

type CourseWithRelations = Course & {
  teacher?: Pick<User, "id" | "firstName" | "lastName" | "email">;
  modules?: (Module & { lessons?: Lesson[] })[];
};

function decimalToNumber(value: Decimal | number): number {
  return typeof value === "number" ? value : Number(value);
}

export function mapLesson(lesson: Lesson) {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    videoUrl: resolveLessonVideoUrl(lesson),
    videoFileName: lesson.videoFileName ?? null,
    videoMimeType: lesson.videoMimeType ?? null,
    videoSize: lesson.videoSize ?? null,
    videoStorageProvider: lesson.videoStorageProvider ?? null,
    videoStorageKey: lesson.videoStorageKey ?? null,
    duration: lesson.duration,
    order: lesson.order,
    moduleId: lesson.moduleId,
    deleteStatus: lesson.deleteStatus,
    createdAt: lesson.createdAt,
  };
}

export function mapModule(module: Module & { lessons?: Lesson[] }) {
  return {
    id: module.id,
    title: module.title,
    order: module.order,
    courseId: module.courseId,
    deleteStatus: module.deleteStatus,
    createdAt: module.createdAt,
    lessons: module.lessons?.sort((a, b) => a.order - b.order).map(mapLesson) ?? [],
  };
}

export function mapCourse(course: CourseWithRelations, includeContent: true): ReturnType<typeof buildBase> & {
  modules: ReturnType<typeof mapModule>[];
};
export function mapCourse(
  course: CourseWithRelations,
  includeContent?: false,
): ReturnType<typeof buildBase>;
export function mapCourse(course: CourseWithRelations, includeContent = false) {
  const base = buildBase(course);

  if (includeContent && course.modules) {
    return {
      ...base,
      modules: course.modules.sort((a, b) => a.order - b.order).map(mapModule),
    };
  }

  return base;
}

function buildBase(course: CourseWithRelations) {
  const status = course.status;
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    thumbnail: resolveCourseThumbnailUrl(course.thumbnail),
    thumbnailFileName: course.thumbnailFileName ?? null,
    price: decimalToNumber(course.price),
    category: course.category,
    level: course.level as CourseLevel,
    status,
    published: status === "APPROVED",
    archived: status === "ARCHIVED",
    rejectionReason: course.rejectionReason ?? null,
    deleteStatus: course.deleteStatus,
    teacherId: course.teacherId,
    teacher: course.teacher
      ? {
          id: course.teacher.id,
          name: `${course.teacher.firstName} ${course.teacher.lastName}`.trim(),
          email: course.teacher.email,
        }
      : undefined,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    moduleCount: course.modules?.length ?? 0,
    lessonCount:
      course.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ?? 0,
  };
}
