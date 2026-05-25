import type { Course } from "./course";
import type { Role } from "./auth";

export interface TeacherDashboardData {
  stats: {
    totalCourses: number;
    published: number;
    drafts: number;
    totalEnrollments: number;
    totalLessons: number;
  };
  publishedCourses: (Course & { enrollmentCount?: number })[];
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
  };
  recentRegistrations: {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: string;
  }[];
  coursesForModeration: (Course & { enrollmentCount?: number })[];
  teachers: { id: string; name: string; email: string; courseCount: number }[];
  isEmpty: boolean;
}

export interface StudentDashboardData {
  stats: {
    enrolled: number;
    inProgress: number;
    completed: number;
    hoursLearned: number;
  };
  enrolledCourses: {
    enrollmentId: string;
    progress: number;
    enrolledAt: string;
    course: Course;
    lastLessonId: string | null;
  }[];
  continueLearning: {
    course: Course;
    lessonTitle: string;
    progress: number;
    slug: string;
  } | null;
  recommendedCourses: Course[];
  isEmpty: boolean;
}

export interface DashboardResponse<T> {
  success: boolean;
  data: T;
}
