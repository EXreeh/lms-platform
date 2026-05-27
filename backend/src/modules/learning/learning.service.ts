import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { mapCourse } from "../courses/courses.mapper.js";
import {
  buildLessonProgressMap,
  flattenCourseLessons,
  mapEnrollment,
  mapLessonProgress,
} from "./learning.mapper.js";

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
} as const;

async function getPublishedCourseOrThrow(idOrSlug: string) {
  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      published: true,
    },
    include: courseInclude,
  });

  if (!course) {
    throw ApiError.notFound("Course not found or not published");
  }

  return course;
}

async function getEnrollmentOrThrow(studentId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });

  if (!enrollment) {
    throw ApiError.forbidden("You must enroll in this course first");
  }

  return enrollment;
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
    include: { modules: { include: { lessons: true } } },
  });

  if (!course) return;

  const allLessons = flattenCourseLessons(course.modules);
  const total = allLessons.length;

  if (total === 0) {
    await prisma.enrollment.update({
      where: { studentId_courseId: { studentId, courseId } },
      data: { progressPercentage: 0, completed: false },
    });
    return;
  }

  const completedCount = await prisma.lessonProgress.count({
    where: { studentId, completed: true, lessonId: { in: allLessons.map((l) => l.id) } },
  });

  const progressPercentage = Math.round((completedCount / total) * 1000) / 10;
  const completed = completedCount >= total;

  await prisma.enrollment.update({
    where: { studentId_courseId: { studentId, courseId } },
    data: { progressPercentage, completed },
  });
}

export async function enrollInCourse(studentId: string, idOrSlug: string) {
  const course = await getPublishedCourseOrThrow(idOrSlug);

  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: course.id } },
  });

  if (existing) {
    throw ApiError.conflict("Already enrolled in this course", "ALREADY_ENROLLED");
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId,
      courseId: course.id,
      progressPercentage: 0,
      completed: false,
    },
  });

  return {
    message: "Enrolled successfully",
    enrollment: mapEnrollment(enrollment),
    course: mapCourse(course, true),
  };
}

export async function getEnrolledCourses(studentId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      course: { include: courseInclude },
    },
    orderBy: { updatedAt: "desc" },
  });

  return enrollments.map((e) => ({
    ...mapEnrollment(e),
    course: mapCourse(e.course, true),
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
      videoUrl: lesson.videoUrl,
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
    completedLessons: progresses.filter((p) => p.completed).length,
    totalLessons: allLessons.length,
  };
}

export async function markLessonCompleted(studentId: string, lessonId: string) {
  const lesson = await getLessonWithCourse(lessonId);
  const course = lesson.module.course;

  if (!course.published) {
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

  if (!course.published) {
    throw ApiError.notFound("Course not found");
  }

  await getEnrollmentOrThrow(studentId, course.id);

  const shouldAutoComplete =
    lesson.duration > 0 && watchedDuration >= Math.floor(lesson.duration * 0.9);

  const progress = await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId, lessonId } },
    create: {
      studentId,
      lessonId,
      watchedDuration,
      completed: shouldAutoComplete,
      completedAt: shouldAutoComplete ? new Date() : null,
    },
    update: {
      watchedDuration: Math.max(watchedDuration, 0),
      ...(shouldAutoComplete && {
        completed: true,
        completedAt: new Date(),
      }),
    },
  });

  await recalculateEnrollmentProgress(studentId, course.id);

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
        videoUrl: targetLesson.videoUrl,
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
