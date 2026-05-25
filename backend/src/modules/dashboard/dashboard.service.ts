import type { Role } from "@lms/database";
import { prisma } from "../../config/database.js";
import { mapCourse } from "../courses/courses.mapper.js";

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
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: userId },
    include: {
      course: {
        include: {
          teacher: { select: teacherSelect },
          modules: { include: { lessons: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const enrolledCourses = enrollments.map((e) => ({
    enrollmentId: e.id,
    progress: e.progress,
    enrolledAt: e.enrolledAt.toISOString(),
    course: mapCourse(e.course, true),
    lastLessonId: e.lastLessonId,
  }));

  const inProgress = enrolledCourses.filter((e) => e.progress > 0 && e.progress < 100);
  const completed = enrolledCourses.filter((e) => e.progress >= 100);

  let continueLearning: {
    course: ReturnType<typeof mapCourse>;
    lessonTitle: string;
    progress: number;
    slug: string;
  } | null = null;

  const active = inProgress[0] ?? enrolledCourses[0];
  if (active) {
    const allLessons = active.course.modules?.flatMap((m) => m.lessons) ?? [];
    const lastLesson = active.lastLessonId
      ? allLessons.find((l) => l.id === active.lastLessonId)
      : allLessons[0];
    continueLearning = {
      course: active.course,
      lessonTitle: lastLesson?.title ?? "Start first lesson",
      progress: active.progress,
      slug: active.course.slug,
    };
  }

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
      enrolled: enrolledCourses.length,
      inProgress: inProgress.length,
      completed: completed.length,
      hoursLearned: Math.round(
        enrollments.reduce((sum, e) => {
          const secs = e.course.modules.reduce(
            (ms, m) => ms + m.lessons.reduce((ls, l) => ls + l.duration, 0),
            0,
          );
          return sum + (secs * e.progress) / 100 / 3600;
        }, 0),
      ),
    },
    enrolledCourses,
    continueLearning,
    recommendedCourses: recommended.map((c) => mapCourse(c)),
    isEmpty: enrolledCourses.length === 0,
  };
}
