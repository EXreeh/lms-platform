import type { Course } from "./course";
import type { Role } from "./auth";
import type { Batch, LiveClass, MessageItem } from "./institute";

export interface TeacherDashboardData {
  stats: {
    totalCourses: number;
    published: number;
    drafts: number;
    underReview?: number;
    totalEnrollments: number;
    totalLessons: number;
    assignedBatches?: number;
    batchStudentCount?: number;
    unreadMessages?: number;
    upcomingLiveClasses?: number;
  };
  batches?: Batch[];
  latestMessage?: MessageItem | null;
  upcomingLiveClasses?: LiveClass[];
  publishedCourses: (Course & { enrollmentCount?: number })[];
  underReviewCourses?: (Course & { enrollmentCount?: number })[];
  draftCourses: (Course & { enrollmentCount?: number })[];
  recentActivity: {
    id: string;
    type: "published" | "updated";
    message: string;
    timestamp: string;
    courseId: string;
    courseSlug: string;
  }[];
  isEmpty: boolean;
}

export interface AdminDashboardData {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalCourses: number;
    publishedCourses: number;
    pendingModeration: number;
    totalEnrollments: number;
    activeUsers: number;
    totalFeesCollected?: number;
    totalPendingFees?: number;
    overdueStudents?: number;
    activeBatches?: number;
    upcomingLiveClasses?: number;
    unreadMessages?: number;
  };
  recentRegistrations: {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: string;
  }[];
  activityFeed: {
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }[];
  coursesForModeration: (Course & { enrollmentCount?: number; archived?: boolean })[];
  teachers: { id: string; name: string; email: string; courseCount: number }[];
  isEmpty: boolean;
}

export interface StudentDashboardData {
  stats: {
    enrolled: number;
    inProgress: number;
    completed: number;
    hoursLearned: number;
    lessonsCompleted?: number;
    averageProgress?: number;
    totalFee?: number;
    paidFee?: number;
    pendingFee?: number;
    feeAccessLabel?: string;
    unreadMessages?: number;
  };
  feeSummary?: {
    totalFee: number;
    paidFee: number;
    pendingFee: number;
    dueDate: string | null;
    accessLabel: string;
  };
  batch?: Batch | null;
  latestMessage?: MessageItem | null;
  upcomingLiveClass?: LiveClass | null;
  enrolledCourses: {
    enrollmentId: string;
    progress: number;
    completed?: boolean;
    enrolledAt: string;
    course: Course;
  }[];
  continueLearning: {
    course: Course;
    lessonId?: string;
    lessonTitle: string;
    moduleTitle?: string;
    progress: number;
    slug: string;
    learnHref?: string;
  } | null;
  recentlyViewed?: {
    lessonId: string;
    lessonTitle: string;
    courseSlug?: string;
    learnHref?: string;
    watchedDuration: number;
    completed: boolean;
    updatedAt: string;
  }[];
  recommendedCourses: Course[];
  isEmpty: boolean;
}

export interface DashboardResponse<T> {
  success: boolean;
  data: T;
}
