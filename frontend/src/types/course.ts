export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface CourseTeacher {
  id: string;
  name: string;
  email: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  duration: number;
  order: number;
  moduleId: string;
  createdAt: string;
}

export interface Module {
  id: string;
  title: string;
  order: number;
  courseId: string;
  createdAt: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  price: number;
  category: string;
  level: CourseLevel;
  published: boolean;
  teacherId: string;
  teacher?: CourseTeacher;
  createdAt: string;
  updatedAt: string;
  moduleCount?: number;
  lessonCount?: number;
  modules?: Module[];
  enrolled?: boolean;
  enrollmentProgress?: number;
  enrollmentCompleted?: boolean;
}

export interface CoursesListResponse {
  success: boolean;
  data: { courses: Course[] };
}

export interface CourseResponse {
  success: boolean;
  data: { course: Course };
}

export interface CategoriesResponse {
  success: boolean;
  data: { categories: string[] };
}

export const COURSE_LEVELS: { value: CourseLevel; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export const COURSE_CATEGORIES = [
  "Development",
  "Business",
  "Design",
  "Marketing",
  "Data Science",
  "Personal Development",
  "AI & Machine Learning",
  "Language",
] as const;

export function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
}
