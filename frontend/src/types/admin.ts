import type { Role } from "./auth";
import type { CourseStatus } from "./course";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  suspended: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  courseCount: number;
  enrollmentCount: number;
  quizAttemptCount: number;
}

export interface AdminUserDetail extends AdminUser {
  courses: {
    id: string;
    title: string;
    slug: string;
    status: CourseStatus;
    deleteStatus?: string;
  }[];
  recentEnrollments: {
    id: string;
    enrolledAt: string;
    progress: number;
    completed: boolean;
    course: { id: string; title: string; slug: string };
  }[];
}

export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  price: number;
  category: string;
  level: string;
  status: CourseStatus;
  published: boolean;
  archived: boolean;
  deleteStatus?: string;
  teacherId: string;
  teacher?: { id: string; name: string; email: string };
  enrollmentCount: number;
  moduleCount?: number;
  lessonCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user: { id: string; name: string; email: string } | null;
  course: { id: string; title: string; slug: string } | null;
}

export interface CourseAnalytics {
  course: AdminCourse & { lessonCount: number; quizCount: number };
  analytics: {
    totalEnrollments: number;
    completedEnrollments: number;
    averageProgress: number;
    quizAttempts: number;
  };
  teacher: { id: string; name: string; email: string } | null;
  recentEnrollments: {
    id: string;
    enrolledAt: string;
    progress: number;
    student: { id: string; name: string; email: string };
  }[];
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  suspended?: boolean;
  sortBy?: "createdAt" | "lastName" | "email" | "role";
  sortOrder?: "asc" | "desc";
}

export interface ListCoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CourseStatus;
  deleteStatus?: "ACTIVE" | "PENDING_DELETE" | "DELETED";
  teacherId?: string;
  activeOnly?: boolean;
  sortBy?: "createdAt" | "title" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ListActivityParams {
  page?: number;
  limit?: number;
  type?: string;
}
