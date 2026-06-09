import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { mapCourse } from "../courses/courses.mapper.js";
import { activeEntityFilter } from "../courses/courses.helpers.js";
import { logAction } from "../../utils/logger.js";
import {
  buildLessonProgressMap,
  flattenCourseLessons,
  mapEnrollment,
  mapLessonProgress,
} from "./learning.mapper.js";
import { resolveLessonVideoUrl } from "../../services/storage/video-url.helpers.js";

const teacherSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const courseInclude = {
  teacher: { select: teacherSelect },
  modules: {
    where: activeEntityFilter(),
    orderBy: { order: "asc" as const },
    include: {
      lessons: {
        where: activeEntityFilter(),
        orderBy: { order: "asc" as const },
      },
    },
  },
} as const;

async function getPublishedCourseOrThrow(idOrSlug: string) {
  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      status: "APPROVED",
      deleteStatus: "ACTIVE",
    },
    include: courseInclude,
  });

  if (!course) {
    throw ApiError.notFound("Course not found or not published");
  }

  return course;
}

async function getEnrollmentOrThrow(studentId: string, courseId: string) {
  const { assertStudentCourseAccess } = await import("../course-access/course-access.service.js");
  return assertStudentCourseAccess(studentId, courseId);
}

async function getLessonWithCourse(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: { include: courseInclude },
        },
      },
    },
  });

  if (!lesson) {
    throw ApiError.notFound("Lesson not found");
  }

  return lesson;
}

async function recalculateEnrollmentProgress(studentId: string, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        where: activeEntityFilter(),
        include: { lessons: { where: activeEntityFilter() } },
      },
    },
  });

  if (!course) return;

  const allLessons = flattenCourseLessons(course.modules);
  const total = allLessons.length;
  const lessonIds = allLessons.map((l) => l.id);

  if (total === 0) {
    await prisma.enrollment.update({
      where: { studentId_courseId: { studentId, courseId } },
      data: { progressPercentage: 0, completed: false },
    });
    return;
  }

  const completedCount = await prisma.lessonProgress.count({
    where: { studentId, completed: true, lessonId: { in: lessonIds } },
  });

  const progressPercentage = Math.round((completedCount / total) * 1000) / 10;
  const completed = completedCount >= total;

  await prisma.enrollment.update({
    where: { studentId_courseId: { studentId, courseId } },
    data: { progressPercentage, completed },
  });

  logAction("progress.recalculate", { studentId, courseId, completedCount, total, progressPercentage });
}

export async function enrollInCourse(_studentId: string, _idOrSlug: string) {
  throw ApiError.forbidden(
    "Self-enrollment is disabled. Contact your institute admin to get course access.",
    "SELF_ENROLL_DISABLED",
  );
}

export async function getEnrolledCourses(studentId: string) {
  const { getAssignedCoursesForStudent } = await import(
    "../course-access/course-access.service.js"
  );
  const assigned = await getAssignedCoursesForStudent(studentId);
  return assigned
    .filter((a) => a.enrollment)
    .map((a) => ({
      ...a.enrollment!,
      course: a.course,
      accessType: a.accessType,
      accessLabel: a.accessLabel,
      accessActive: a.accessActive,
      lifetimeAccess: a.lifetimeAccess,
    }));
}

export async function getCourseProgress(studentId: string, idOrSlug: string) {
  const course = await getPublishedCourseOrThrow(idOrSlug);
  const enrollment = await getEnrollmentOrThrow(studentId, course.id);

  const allLessons = flattenCourseLessons(course.modules);
  const lessonIds = allLessons.map((l) => l.id);

  const progresses = await prisma.lessonProgress.findMany({
    where: { studentId, lessonId: { in: lessonIds } },
  });

  const progressMap = buildLessonProgressMap(progresses);

  const modulesWithProgress = course.modules.map((mod) => ({
    id: mod.id,
    title: mod.title,
    order: mod.order,
    lessons: mod.lessons.map((lesson) => ({
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
      progress: progressMap.get(lesson.id) ?? null,
    })),
  }));

  return {
    enrollment: mapEnrollment(enrollment),
    course: {
      ...mapCourse(course, true),
      modules: modulesWithProgress,
    },
    lessons: allLessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      moduleId: lesson.moduleId,
      moduleTitle: lesson.moduleTitle,
      order: lesson.order,
      progress: progressMap.get(lesson.id) ?? null,
    })),
    completedLessons: progresses.filter((p) => p.completed && lessonIds.includes(p.lessonId)).length,
    totalLessons: allLessons.length,
  };
}

export async function markLessonCompleted(studentId: string, lessonId: string) {
  const lesson = await getLessonWithCourse(lessonId);
  const course = lesson.module.course;

  if (course.status !== "APPROVED" || course.deleteStatus !== "ACTIVE") {
    throw ApiError.notFound("Course not found");
  }

  await getEnrollmentOrThrow(studentId, course.id);

  const progress = await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId, lessonId } },
    create: {
      studentId,
      lessonId,
      completed: true,
      watchedDuration: lesson.duration || 0,
      completedAt: new Date(),
    },
    update: {
      completed: true,
      watchedDuration: Math.max(lesson.duration, 0),
      completedAt: new Date(),
    },
  });

  await recalculateEnrollmentProgress(studentId, course.id);

  logAction("progress.lesson_complete", { studentId, lessonId, courseId: course.id });

  const updatedEnrollment = await prisma.enrollment.findUniqueOrThrow({
    where: { studentId_courseId: { studentId, courseId: course.id } },
  });

  return {
    lessonProgress: mapLessonProgress(progress),
    enrollment: mapEnrollment(updatedEnrollment),
    courseId: course.id,
    courseSlug: course.slug,
  };
}

export async function updateWatchedDuration(
  studentId: string,
  lessonId: string,
  watchedDuration: number,
) {
  const lesson = await getLessonWithCourse(lessonId);
  const course = lesson.module.course;

  if (course.status !== "APPROVED" || course.deleteStatus !== "ACTIVE") {
    throw ApiError.notFound("Course not found");
  }

  await getEnrollmentOrThrow(studentId, course.id);

  const progress = await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId, lessonId } },
    create: {
      studentId,
      lessonId,
      watchedDuration,
      completed: false,
    },
    update: {
      watchedDuration: Math.max(watchedDuration, 0),
    },
  });

  logAction("progress.watch_update", { studentId, lessonId, watchedDuration });

  const updatedEnrollment = await prisma.enrollment.findUniqueOrThrow({
    where: { studentId_courseId: { studentId, courseId: course.id } },
  });

  return {
    lessonProgress: mapLessonProgress(progress),
    enrollment: mapEnrollment(updatedEnrollment),
  };
}

export async function getContinueLearning(studentId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, completed: false },
    include: { course: { include: courseInclude } },
    orderBy: { updatedAt: "desc" },
  });

  if (enrollments.length === 0) {
    return null;
  }

  for (const enrollment of enrollments) {
    const allLessons = flattenCourseLessons(enrollment.course.modules);
    if (allLessons.length === 0) continue;

    const progresses = await prisma.lessonProgress.findMany({
      where: {
        studentId,
        lessonId: { in: allLessons.map((l) => l.id) },
      },
      orderBy: { updatedAt: "desc" },
    });

    const completedIds = new Set(progresses.filter((p) => p.completed).map((p) => p.lessonId));

    const recent = progresses[0];
    let targetLesson = recent
      ? allLessons.find((l) => l.id === recent.lessonId)
      : undefined;

    if (targetLesson && completedIds.has(targetLesson.id)) {
      targetLesson = allLessons.find((l) => !completedIds.has(l.id));
    }

    if (!targetLesson) {
      targetLesson = allLessons.find((l) => !completedIds.has(l.id)) ?? allLessons[0];
    }

    return {
      course: mapCourse(enrollment.course, true),
      enrollment: mapEnrollment(enrollment),
      lesson: {
        id: targetLesson.id,
        title: targetLesson.title,
        moduleTitle: targetLesson.moduleTitle,
        videoUrl: resolveLessonVideoUrl(targetLesson),
      },
      progressPercentage: enrollment.progressPercentage,
      courseSlug: enrollment.course.slug,
    };
  }

  return null;
}

export async function getStudentAnalytics(studentId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      course: {
        include: {
          modules: { include: { lessons: true } },
        },
      },
    },
  });

  const lessonProgresses = await prisma.lessonProgress.findMany({
    where: { studentId },
    include: {
      lesson: {
        include: {
          module: { include: { course: { select: { slug: true } } } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const completedCourses = enrollments.filter((e) => e.completed).length;
  const inProgressCourses = enrollments.filter(
    (e) => !e.completed && e.progressPercentage > 0,
  ).length;

  const totalLessonsCompleted = lessonProgresses.filter((p) => p.completed).length;

  const totalWatchSeconds = lessonProgresses.reduce((sum, p) => sum + p.watchedDuration, 0);

  const recentlyViewed = lessonProgresses.slice(0, 6).map((p) => {
    const courseSlug = p.lesson.module.course.slug;
    return {
      lessonId: p.lessonId,
      lessonTitle: p.lesson.title,
      courseSlug,
      learnHref: `/courses/${courseSlug}/learn?lesson=${p.lessonId}`,
      watchedDuration: p.watchedDuration,
      completed: p.completed,
      updatedAt: p.updatedAt.toISOString(),
    };
  });

  const avgProgress =
    enrollments.length > 0
      ? Math.round(
          (enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / enrollments.length) *
            10,
        ) / 10
      : 0;

  return {
    enrolled: enrollments.length,
    completedCourses,
    inProgressCourses,
    totalLessonsCompleted,
    hoursLearned: Math.round((totalWatchSeconds / 3600) * 10) / 10,
    averageProgress: avgProgress,
    recentlyViewed,
  };
}

export async function getCoursePreview(idOrSlug: string) {
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: courseInclude,
  });

  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  const allLessons = flattenCourseLessons(course.modules);

  const modulesWithLessons = course.modules.map((mod) => ({
    id: mod.id,
    title: mod.title,
    order: mod.order,
    lessons: mod.lessons.map((lesson) => ({
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
      progress: null,
    })),
  }));

  return {
    preview: true,
    enrollment: null,
    course: {
      ...mapCourse(course, true),
      modules: modulesWithLessons,
    },
    lessons: allLessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      moduleId: lesson.moduleId,
      moduleTitle: lesson.moduleTitle,
      order: lesson.order,
      progress: null,
    })),
    completedLessons: 0,
    totalLessons: allLessons.length,
  };
}
