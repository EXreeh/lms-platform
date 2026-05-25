import type {
  TeacherDashboardData,
  AdminDashboardData,
  StudentDashboardData,
} from "@/types/dashboard";
import type { Course } from "@/types/course";

export function isDemoCourseId(id: string): boolean {
  return id.startsWith("demo-");
}

const demoThumbnail =
  "https://images.unsplash.com/photo-1677440866019-2178eced5449?w=800&q=80";

const demoCourse = (overrides: Partial<Course> & Pick<Course, "title" | "slug">): Course => ({
  id: `demo-${overrides.slug}`,
  description: overrides.description ?? "Demo course preview — run npm run db:seed for live data.",
  thumbnail: overrides.thumbnail ?? demoThumbnail,
  price: overrides.price ?? 49.99,
  category: overrides.category ?? "AI & Machine Learning",
  level: overrides.level ?? "BEGINNER",
  published: overrides.published ?? true,
  teacherId: "demo-teacher",
  teacher: { id: "demo-teacher", name: "Alex Morgan", email: "teacher@cognitiax.ai" },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  moduleCount: overrides.moduleCount ?? 3,
  lessonCount: overrides.lessonCount ?? 12,
  ...overrides,
});

export function getDemoTeacherDashboard(): TeacherDashboardData {
  const published = [
    demoCourse({
      title: "Introduction to AI & Machine Learning",
      slug: "intro-ai-machine-learning",
      published: true,
    }),
    demoCourse({
      title: "Full-Stack Web Development",
      slug: "full-stack-web-development",
      category: "Development",
      level: "INTERMEDIATE",
      price: 39.99,
      thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
    }),
  ];
  const drafts = [
    demoCourse({
      title: "Data Science with Python",
      slug: "data-science-python",
      published: false,
      category: "Data Science",
      level: "ADVANCED",
    }),
  ];

  return {
    stats: {
      totalCourses: 3,
      published: 2,
      drafts: 1,
      totalEnrollments: 24,
      totalLessons: 18,
    },
    publishedCourses: published,
    draftCourses: drafts,
    recentActivity: [
      {
        id: "1",
        type: "published",
        message: '"Introduction to AI & Machine Learning" is live in the catalog',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        courseId: published[0].id,
        courseSlug: published[0].slug,
      },
      {
        id: "2",
        type: "updated",
        message: 'Draft updated: "Data Science with Python"',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        courseId: drafts[0].id,
        courseSlug: drafts[0].slug,
      },
    ],
    isEmpty: true,
  };
}

export function getDemoAdminDashboard(): AdminDashboardData {
  return {
    stats: {
      totalStudents: 128,
      totalTeachers: 12,
      totalCourses: 3,
      publishedCourses: 2,
      pendingModeration: 1,
    },
    recentRegistrations: [
      {
        id: "1",
        name: "Jordan Lee",
        email: "student@cognitiax.ai",
        role: "STUDENT",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: "2",
        name: "Alex Morgan",
        email: "teacher@cognitiax.ai",
        role: "TEACHER",
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ],
    coursesForModeration: [
      demoCourse({
        title: "Data Science with Python",
        slug: "data-science-python",
        published: false,
        category: "Data Science",
        level: "ADVANCED",
      }),
    ],
    teachers: [
      { id: "t1", name: "Alex Morgan", email: "teacher@cognitiax.ai", courseCount: 3 },
    ],
    isEmpty: true,
  };
}

export function getDemoStudentDashboard(): StudentDashboardData {
  const course = demoCourse({
    title: "Introduction to AI & Machine Learning",
    slug: "intro-ai-machine-learning",
  });

  return {
    stats: { enrolled: 1, inProgress: 1, completed: 0, hoursLearned: 4 },
    enrolledCourses: [
      {
        enrollmentId: "demo-enroll-1",
        progress: 35,
        enrolledAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        course,
        lastLessonId: null,
      },
    ],
    continueLearning: {
      course,
      lessonTitle: "Types of Machine Learning",
      progress: 35,
      slug: course.slug,
    },
    recommendedCourses: [
      demoCourse({
        title: "Full-Stack Web Development",
        slug: "full-stack-web-development",
        category: "Development",
        level: "INTERMEDIATE",
        price: 39.99,
        thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
      }),
    ],
    isEmpty: true,
  };
}
