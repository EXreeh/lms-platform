import type { Course, Lesson, Module } from "./course";

export interface LessonProgressRecord {
  id: string;
  lessonId: string;
  completed: boolean;
  watchedDuration: number;
  completedAt: string | null;
  updatedAt: string;
}

export interface EnrollmentRecord {
  id: string;
  courseId: string;
  enrolledAt: string;
  completed: boolean;
  progressPercentage: number;
  updatedAt: string;
}

export interface LessonWithProgress extends Lesson {
  progress: LessonProgressRecord | null;
}

export interface ModuleWithProgress extends Omit<Module, "lessons"> {
  lessons: LessonWithProgress[];
}

export interface CourseProgressData {
  preview?: boolean;
  enrollment: EnrollmentRecord | null;
  course: Course & { modules: ModuleWithProgress[] };
  lessons: {
    id: string;
    title: string;
    moduleId: string;
    moduleTitle: string;
    order: number;
    progress: LessonProgressRecord | null;
  }[];
  completedLessons: number;
  totalLessons: number;
}

export interface ContinueLearningData {
  course: Course;
  enrollment: EnrollmentRecord;
  lesson: {
    id: string;
    title: string;
    moduleTitle: string;
    videoUrl: string | null;
  };
  progressPercentage: number;
  courseSlug: string;
}

export interface StudentAnalytics {
  enrolled: number;
  completedCourses: number;
  inProgressCourses: number;
  totalLessonsCompleted: number;
  hoursLearned: number;
  averageProgress: number;
  recentlyViewed: {
    lessonId: string;
    lessonTitle: string;
    watchedDuration: number;
    completed: boolean;
    updatedAt: string;
  }[];
}

export interface CourseProgressResponse {
  success: boolean;
  data: CourseProgressData;
}

export interface ContinueLearningResponse {
  success: boolean;
  data: { continueLearning: ContinueLearningData | null };
}

export interface AnalyticsResponse {
  success: boolean;
  data: StudentAnalytics;
}

export interface EnrollmentsResponse {
  success: boolean;
  data: {
    enrollments: (EnrollmentRecord & { course: Course })[];
  };
}

export interface LessonActionResponse {
  success: boolean;
  data: {
    lessonProgress: LessonProgressRecord;
    enrollment: EnrollmentRecord;
    courseId?: string;
    courseSlug?: string;
  };
}
