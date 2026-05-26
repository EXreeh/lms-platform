import type { Role } from "@lms/database";
import { prisma } from "../../config/database.js";
import { mapCourse } from "../courses/courses.mapper.js";
import * as learningService from "../learning/learning.service.js";

const teacherSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const courseListInclude = {
  teacher: { select: teacherSelect },
  modules: { include: { lessons: true } },
  _count: { select: { enrollments: true } },
} as const;

export async function getTeacherDashboard(userId: string) {
  const courses = await prisma.course.findMany({
    where: { teacherId: userId },
    include: courseListInclude,
    orderBy: { updatedAt: "desc" },
  });

  const mapped = courses.map((c) => ({
    ...mapCourse(c),
    enrollmentCount: c._count.enrollments,
  }));

  const published = mapped.filter((c) => c.published);
  const drafts = mapped.filter((c) => !c.published);

  const totalEnrollments = courses.reduce((sum, c) => sum + c._count.enrollments, 0);
  const totalLessons = courses.reduce(
    (sum, c) => sum + c.modules.reduce((ms, m) => ms + m.lessons.length, 0),
    0,
  );

  const recentActivity = courses.slice(0, 5).map((c) => ({
    id: c.id,
    type: c.published ? ("published" as const) : ("updated" as const),
    message: c.published
      ? `"${c.title}" is live in the catalog`
      : `Draft updated: "${c.title}"`,
    timestamp: c.updatedAt.toISOString(),
    courseId: c.id,
    courseSlug: c.slug,
  }));

  return {
    stats: {
      totalCourses: courses.length,
      published: published.length,
      drafts: drafts.length,
      totalEnrollments,
      totalLessons,
    },
    publishedCourses: published,
    draftCourses: drafts,
    recentActivity,
    isEmpty: courses.length === 0,
  };
}

export async function getAdminDashboard() {
  const [studentCount, teacherCount, courseCount, publishedCount, recentUsers, courses, teachers] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.course.count(),
      prisma.course.count({ where: { published: true } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.course.findMany({
        include: {
          teacher: { select: teacherSelect },
          modules: { include: { lessons: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      prisma.user.findMany({
        where: { role: "TEACHER" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          _count: { select: { courses: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  const coursesForModeration = courses
    .filter((c) => !c.published)
    .map((c) => ({ ...mapCourse(c), enrollmentCount: c._count.enrollments }));

  return {
    stats: {
      totalStudents: studentCount,
      totalTeachers: teacherCount,
      totalCourses: courseCount,
      publishedCourses: publishedCount,
      pendingModeration: courseCount - publishedCount,
    },
    recentRegistrations: recentUsers.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      role: u.role as Role,
      createdAt: u.createdAt.toISOString(),
    })),
    coursesForModeration,
    teachers: teachers.map((t) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`.trim(),
      email: t.email,
      courseCount: t._count.courses,
    })),
    isEmpty: courseCount === 0 && studentCount === 0,
  };
}

export async function getStudentDashboard(userId: string) {
  const [enrollments, analytics, continueLearning] = await Promise.all([
    learningService.getEnrolledCourses(userId),
    learningService.getStudentAnalytics(userId),
    learningService.getContinueLearning(userId),
  ]);

  const enrolledCourses = enrollments.map((e) => ({
    enrollmentId: e.id,
    progress: e.progressPercentage,
    completed: e.completed,
    enrolledAt: e.enrolledAt,
    course: e.course,
  }));

  const enrolledIds = enrollments.map((e) => e.courseId);
  const recommended = await prisma.course.findMany({
    where: {
      published: true,
      id: { notIn: enrolledIds.length ? enrolledIds : ["__none__"] },
    },
    include: courseListInclude,
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  return {
    stats: {
      enrolled: analytics.enrolled,
      inProgress: analytics.inProgressCourses,
      completed: analytics.completedCourses,
      hoursLearned: analytics.hoursLearned,
      lessonsCompleted: analytics.totalLessonsCompleted,
      averageProgress: analytics.averageProgress,
    },
    enrolledCourses,
    continueLearning: continueLearning
      ? {
          course: continueLearning.course,
          lessonId: continueLearning.lesson.id,
          lessonTitle: continueLearning.lesson.title,
          moduleTitle: continueLearning.lesson.moduleTitle,
          progress: continueLearning.progressPercentage,
          slug: continueLearning.courseSlug,
          learnHref: `/courses/${continueLearning.courseSlug}/learn?lesson=${continueLearning.lesson.id}`,
        }
      : null,
    recentlyViewed: analytics.recentlyViewed,
    recommendedCourses: recommended.map((c) => mapCourse(c)),
    isEmpty: enrolledCourses.length === 0,
  };
}
