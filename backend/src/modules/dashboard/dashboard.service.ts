import type { Role } from "@lms/database";
import { prisma } from "../../config/database.js";
import { mapCourse } from "../courses/courses.mapper.js";
import * as learningService from "../learning/learning.service.js";
import { getPlatformStats, listActivity } from "../admin/admin.service.js";
import * as messagesService from "../messages/messages.service.js";
import * as batchesService from "../batches/batches.service.js";
import * as feesService from "../fees/fees.service.js";
import * as liveClassesService from "../live-classes/live-classes.service.js";
import { logPrismaRouteError } from "../../utils/prisma-safe.js";

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

const EMPTY_FEE_STATS = {
  totalFeesCollected: 0,
  totalPendingFees: 0,
  overdueStudents: 0,
  activeBatches: 0,
  upcomingLiveClasses: 0,
  unreadMessages: 0,
};

export async function getTeacherDashboard(userId: string) {
  const [courses, batches, unreadMessages, upcomingLive, liveClassStats] = await Promise.all([
    prisma.course.findMany({
      where: { teacherId: userId, deleteStatus: { not: "DELETED" } },
      include: courseListInclude,
      orderBy: { updatedAt: "desc" },
    }),
    batchesService.getTeacherBatches(userId),
    messagesService.getUnreadCount(userId),
    liveClassesService.listLiveClasses({ teacherId: userId, upcoming: true }),
    liveClassesService.getLiveClassStats({ role: "TEACHER", userId }),
  ]);

  const mapped = courses.map((c) => ({
    ...mapCourse(c),
    enrollmentCount: c._count?.enrollments ?? 0,
  }));

  const published = mapped.filter((c) => c.status === "APPROVED");
  const underReview = mapped.filter((c) => c.status === "UNDER_REVIEW");
  const drafts = mapped.filter((c) => c.status === "DRAFT" || c.status === "REJECTED");

  const totalEnrollments = courses.reduce((sum, c) => sum + (c._count?.enrollments ?? 0), 0);
  const totalLessons = courses.reduce(
    (sum, c) =>
      sum + (c.modules ?? []).reduce((ms, m) => ms + (m.lessons?.length ?? 0), 0),
    0,
  );

  const recentActivity = courses.slice(0, 5).map((c) => ({
    id: c.id,
    type: c.status === "APPROVED" ? ("published" as const) : ("updated" as const),
    message:
      c.status === "APPROVED"
        ? `"${c.title}" is live in the catalog`
        : c.status === "UNDER_REVIEW"
          ? `"${c.title}" is awaiting review`
          : `Draft updated: "${c.title}"`,
    timestamp: c.updatedAt.toISOString(),
    courseId: c.id,
    courseSlug: c.slug,
  }));

  const batchStudentCount = (batches ?? []).reduce((sum, b) => sum + (b.studentCount ?? 0), 0);
  const latestMessages = await messagesService.getInbox(userId);
  const latestMessage = latestMessages[0] ?? null;

  return {
    stats: {
      totalCourses: courses.length,
      published: published.length,
      drafts: drafts.length,
      underReview: underReview.length,
      totalEnrollments,
      totalLessons,
      assignedBatches: batches?.length ?? 0,
      batchStudentCount,
      unreadMessages: unreadMessages ?? 0,
      upcomingLiveClasses: upcomingLive?.length ?? 0,
      todaysLiveClasses: liveClassStats?.today ?? 0,
      totalRecordings: liveClassStats?.totalRecordings ?? 0,
    },
    batches: batches ?? [],
    latestMessage,
    upcomingLiveClasses: (upcomingLive ?? []).slice(0, 5),
    publishedCourses: published,
    underReviewCourses: underReview,
    draftCourses: drafts,
    recentActivity,
    isEmpty: courses.length === 0,
  };
}

export async function getAdminDashboard(adminUserId: string) {
  try {
    await feesService.refreshOverdueStatuses();

    const [stats, recentUsers, courses, teachers, activityResult, feeAnalytics, activeBatches, upcomingLive, liveClassStats, unreadMessages] =
      await Promise.all([
        getPlatformStats(),
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
          where: { deleteStatus: "ACTIVE", status: { not: "ARCHIVED" } },
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
        listActivity({ page: 1, limit: 15 }),
        feesService.getFeeAnalytics(),
        batchesService.getActiveBatchCount(),
        liveClassesService.getUpcomingCount(),
        liveClassesService.getLiveClassStats({ role: "ADMIN", userId: adminUserId }),
        messagesService.getUnreadCount(adminUserId),
      ]);

    const coursesForModeration = (courses ?? [])
      .filter((c) => c.status === "UNDER_REVIEW")
      .map((c) => ({
        ...mapCourse(c),
        enrollmentCount: c._count?.enrollments ?? 0,
      }));

    return {
      stats: {
        totalStudents: stats?.totalStudents ?? 0,
        totalTeachers: stats?.totalTeachers ?? 0,
        totalCourses: stats?.totalCourses ?? 0,
        publishedCourses: stats?.publishedCourses ?? 0,
        pendingModeration: stats?.pendingModeration ?? 0,
        totalEnrollments: stats?.totalEnrollments ?? 0,
        activeUsers: stats?.activeUsers ?? 0,
        totalFeesCollected: feeAnalytics?.totalCollected ?? 0,
        totalPendingFees: feeAnalytics?.totalPending ?? 0,
        overdueStudents: feeAnalytics?.overdueStudents ?? 0,
        activeBatches: activeBatches ?? 0,
        upcomingLiveClasses: upcomingLive ?? 0,
        completedLiveClasses: liveClassStats?.completed ?? 0,
        todaysLiveClasses: liveClassStats?.today ?? 0,
        totalRecordings: liveClassStats?.totalRecordings ?? 0,
        unreadMessages: unreadMessages ?? 0,
      },
      recentRegistrations: (recentUsers ?? []).map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        role: u.role as Role,
        createdAt: u.createdAt.toISOString(),
      })),
      activityFeed: (activityResult?.activities ?? []).map((a) => ({
        id: a.id,
        type: a.type,
        message: a.message,
        timestamp: a.timestamp,
      })),
      coursesForModeration,
      teachers: (teachers ?? []).map((t) => ({
        id: t.id,
        name: `${t.firstName} ${t.lastName}`.trim(),
        email: t.email,
        courseCount: t._count?.courses ?? 0,
      })),
      isEmpty: false,
    };
  } catch (error) {
    logPrismaRouteError("/api/dashboard/admin", error, "getAdminDashboard");
    return {
      stats: {
        totalStudents: 0,
        totalTeachers: 0,
        totalCourses: 0,
        publishedCourses: 0,
        pendingModeration: 0,
        totalEnrollments: 0,
        activeUsers: 0,
        ...EMPTY_FEE_STATS,
      },
      recentRegistrations: [],
      activityFeed: [],
      coursesForModeration: [],
      teachers: [],
      isEmpty: true,
    };
  }
}

export async function getStudentDashboard(userId: string) {
  await feesService.refreshOverdueStatuses();

  const [enrollments, analytics, continueLearning, feeDashboard, batch, unreadMessages, upcomingLive] =
    await Promise.all([
      learningService.getEnrolledCourses(userId),
      learningService.getStudentAnalytics(userId),
      learningService.getContinueLearning(userId),
      feesService.getStudentFeeDashboard(userId),
      batchesService.getStudentBatch(userId),
      messagesService.getUnreadCount(userId),
      liveClassesService.listLiveClasses({ studentId: userId, upcoming: true }),
    ]);

  const latestMessages = await messagesService.getInbox(userId);
  const latestMessage = latestMessages[0] ?? null;
  const primaryPlan = feeDashboard?.plans?.[0];

  const enrolledCourses = (enrollments ?? []).map((e) => ({
    enrollmentId: e.id,
    progress: e.progressPercentage ?? 0,
    completed: e.completed,
    enrolledAt: e.enrolledAt,
    course: e.course,
  }));

  const enrolledIds = (enrollments ?? []).map((e) => e.courseId);
  const recommended = await prisma.course.findMany({
    where: {
      status: "APPROVED",
      deleteStatus: "ACTIVE",
      id: { notIn: enrolledIds.length ? enrolledIds : ["__none__"] },
    },
    include: courseListInclude,
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  return {
    stats: {
      enrolled: analytics?.enrolled ?? 0,
      inProgress: analytics?.inProgressCourses ?? 0,
      completed: analytics?.completedCourses ?? 0,
      hoursLearned: analytics?.hoursLearned ?? 0,
      lessonsCompleted: analytics?.totalLessonsCompleted ?? 0,
      averageProgress: analytics?.averageProgress ?? 0,
      totalFee: feeDashboard?.totalFee ?? 0,
      paidFee: feeDashboard?.paidFee ?? 0,
      pendingFee: feeDashboard?.pendingFee ?? 0,
      feeAccessLabel: primaryPlan?.accessLabel ?? "Active",
      unreadMessages: unreadMessages ?? 0,
    },
    feeSummary: {
      totalFee: feeDashboard?.totalFee ?? 0,
      paidFee: feeDashboard?.paidFee ?? 0,
      pendingFee: feeDashboard?.pendingFee ?? 0,
      dueDate: primaryPlan?.dueDate ?? null,
      accessLabel: primaryPlan?.accessLabel ?? "Active",
    },
    batch: batch ?? null,
    latestMessage,
    upcomingLiveClass: upcomingLive?.[0] ?? null,
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
    recentlyViewed: analytics?.recentlyViewed ?? [],
    recommendedCourses: (recommended ?? []).map((c) => mapCourse(c)),
    isEmpty: enrolledCourses.length === 0,
  };
}
