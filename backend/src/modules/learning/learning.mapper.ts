import type { Enrollment, Lesson, LessonProgress, Module } from "@lms/database";

export function mapLessonProgress(lp: LessonProgress) {
  return {
    id: lp.id,
    lessonId: lp.lessonId,
    completed: lp.completed,
    watchedDuration: lp.watchedDuration,
    completedAt: lp.completedAt?.toISOString() ?? null,
    updatedAt: lp.updatedAt.toISOString(),
  };
}

export function mapEnrollment(enrollment: Enrollment) {
  return {
    id: enrollment.id,
    courseId: enrollment.courseId,
    enrolledAt: enrollment.enrolledAt.toISOString(),
    completed: enrollment.completed,
    progressPercentage: enrollment.progressPercentage,
    updatedAt: enrollment.updatedAt.toISOString(),
  };
}

export type FlatLesson = Lesson & { moduleId: string; moduleTitle: string; moduleOrder: number };

export function flattenCourseLessons(
  modules: (Module & { lessons: Lesson[] })[],
): FlatLesson[] {
  return [...modules]
    .sort((a, b) => a.order - b.order)
    .flatMap((mod) =>
      [...mod.lessons]
        .sort((a, b) => a.order - b.order)
        .map((lesson) => ({
          ...lesson,
          moduleId: mod.id,
          moduleTitle: mod.title,
          moduleOrder: mod.order,
        })),
    );
}

export function buildLessonProgressMap(progresses: LessonProgress[]) {
  return new Map(progresses.map((p) => [p.lessonId, mapLessonProgress(p)]));
}
