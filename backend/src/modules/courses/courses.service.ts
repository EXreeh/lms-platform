import type { Prisma, Role } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { slugify, uniqueSlug } from "../../utils/slug.js";
import { mapCourse } from "./courses.mapper.js";
import type {
  CreateCourseInput,
  UpdateCourseInput,
  ListCoursesQuery,
} from "./courses.validation.js";

const teacherSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const courseInclude = {
  teacher: { select: teacherSelect },
  modules: {
    orderBy: { order: "asc" as const },
    include: {
      lessons: { orderBy: { order: "asc" as const } },
    },
  },
};

function canManageCourse(
  userId: string,
  role: Role,
  teacherId: string,
): boolean {
  return role === "ADMIN" || (role === "TEACHER" && userId === teacherId);
}

async function getCourseOrThrow(idOrSlug: string) {
  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: courseInclude,
  });

  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  return course;
}

export async function createCourse(userId: string, role: Role, input: CreateCourseInput) {
  if (role !== "TEACHER" && role !== "ADMIN") {
    throw ApiError.forbidden("Only teachers and admins can create courses");
  }

  const teacherId = role === "ADMIN" && input ? userId : userId;
  const slug = await uniqueSlug(input.title, async (s) => {
    const found = await prisma.course.findUnique({ where: { slug: s } });
    return Boolean(found);
  });

  const course = await prisma.course.create({
    data: {
      title: input.title,
      slug,
      description: input.description,
      thumbnail: input.thumbnail || null,
      price: input.price,
      category: input.category,
      level: input.level,
      teacherId,
    },
    include: courseInclude,
  });

  return mapCourse(course);
}

export async function updateCourse(
  userId: string,
  role: Role,
  idOrSlug: string,
  input: UpdateCourseInput,
) {
  const existing = await getCourseOrThrow(idOrSlug);

  if (!canManageCourse(userId, role, existing.teacherId)) {
    throw ApiError.forbidden("You do not have permission to edit this course");
  }

  let slug = existing.slug;
  if (input.title && slugify(input.title) !== slugify(existing.title)) {
    slug = await uniqueSlug(input.title, async (s) => {
      const found = await prisma.course.findFirst({
        where: { slug: s, NOT: { id: existing.id } },
      });
      return Boolean(found);
    });
  }

  const course = await prisma.course.update({
    where: { id: existing.id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.thumbnail !== undefined && { thumbnail: input.thumbnail || null }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.level !== undefined && { level: input.level }),
      slug,
    },
    include: courseInclude,
  });

  return mapCourse(course);
}

export async function deleteCourse(userId: string, role: Role, idOrSlug: string) {
  const existing = await getCourseOrThrow(idOrSlug);

  if (!canManageCourse(userId, role, existing.teacherId)) {
    throw ApiError.forbidden("You do not have permission to delete this course");
  }

  await prisma.course.delete({ where: { id: existing.id } });

  return { message: "Course deleted successfully" };
}

export async function listCourses(
  userId: string | undefined,
  role: Role | undefined,
  query: ListCoursesQuery,
) {
  const isStaff = role === "TEACHER" || role === "ADMIN";

  const where: Prisma.CourseWhereInput = {};

  if (query.mine && userId && isStaff) {
    where.teacherId = userId;
    if (query.published !== undefined) {
      where.published = query.published;
    }
  } else {
    where.published = query.published ?? true;
  }

  if (query.category) {
    where.category = { equals: query.category, mode: "insensitive" };
  }

  if (query.level) {
    where.level = query.level;
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const courses = await prisma.course.findMany({
    where,
    include: {
      teacher: { select: teacherSelect },
      modules: { include: { lessons: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return courses.map((c) => mapCourse(c));
}

export async function getCourse(
  idOrSlug: string,
  userId?: string,
  role?: Role,
) {
  const course = await getCourseOrThrow(idOrSlug);
  const canView =
    course.published ||
    (userId && canManageCourse(userId, role ?? "STUDENT", course.teacherId));

  if (!canView) {
    throw ApiError.notFound("Course not found");
  }

  const mapped = mapCourse(course, true);

  if (userId && role === "STUDENT") {
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: userId, courseId: course.id } },
    });
    return {
      ...mapped,
      enrolled: Boolean(enrollment),
      enrollmentProgress: enrollment?.progress,
    };
  }

  return mapped;
}

export async function publishCourse(
  userId: string,
  role: Role,
  idOrSlug: string,
  published: boolean,
) {
  const existing = await getCourseOrThrow(idOrSlug);

  if (!canManageCourse(userId, role, existing.teacherId)) {
    throw ApiError.forbidden("You do not have permission to publish this course");
  }

  const course = await prisma.course.update({
    where: { id: existing.id },
    data: { published },
    include: courseInclude,
  });

  return mapCourse(course);
}

export async function createModule(
  userId: string,
  role: Role,
  courseId: string,
  input: { title: string; order?: number },
) {
  const course = await getCourseOrThrow(courseId);

  if (!canManageCourse(userId, role, course.teacherId)) {
    throw ApiError.forbidden();
  }

  const maxOrder = course.modules.reduce((max, m) => Math.max(max, m.order), -1);
  const order = input.order ?? maxOrder + 1;

  await prisma.module.create({
    data: {
      title: input.title,
      order,
      courseId: course.id,
    },
    include: { lessons: true },
  });

  return mapCourse(
    await prisma.course.findUniqueOrThrow({
      where: { id: course.id },
      include: courseInclude,
    }),
    true,
  );
}

export async function createLesson(
  userId: string,
  role: Role,
  moduleId: string,
  input: {
    title: string;
    description?: string;
    videoUrl?: string;
    duration?: number;
    order?: number;
  },
) {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      lessons: true,
      course: true,
    },
  });

  if (!module) {
    throw ApiError.notFound("Module not found");
  }

  if (!canManageCourse(userId, role, module.course.teacherId)) {
    throw ApiError.forbidden();
  }

  const maxOrder = module.lessons.reduce((max, l) => Math.max(max, l.order), -1);
  const order = input.order ?? maxOrder + 1;

  await prisma.lesson.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      videoUrl: input.videoUrl || null,
      duration: input.duration ?? 0,
      order,
      moduleId: module.id,
    },
  });

  return mapCourse(
    await prisma.course.findUniqueOrThrow({
      where: { id: module.courseId },
      include: courseInclude,
    }),
    true,
  );
}

export async function deleteModule(userId: string, role: Role, moduleId: string) {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: true },
  });

  if (!module) throw ApiError.notFound("Module not found");
  if (!canManageCourse(userId, role, module.course.teacherId)) {
    throw ApiError.forbidden();
  }

  await prisma.module.delete({ where: { id: moduleId } });

  return mapCourse(
    await prisma.course.findUniqueOrThrow({
      where: { id: module.courseId },
      include: courseInclude,
    }),
    true,
  );
}

export async function deleteLesson(userId: string, role: Role, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });

  if (!lesson) throw ApiError.notFound("Lesson not found");
  if (!canManageCourse(userId, role, lesson.module.course.teacherId)) {
    throw ApiError.forbidden();
  }

  await prisma.lesson.delete({ where: { id: lessonId } });

  return mapCourse(
    await prisma.course.findUniqueOrThrow({
      where: { id: lesson.module.courseId },
      include: courseInclude,
    }),
    true,
  );
}

export async function getCategories() {
  const rows = await prisma.course.findMany({
    where: { published: true },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  return rows.map((r) => r.category);
}

export async function enrollInCourse(studentId: string, idOrSlug: string) {
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], published: true },
    include: { modules: { include: { lessons: true } } },
  });

  if (!course) {
    throw ApiError.notFound("Course not found or not published");
  }

  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: course.id } },
  });

  if (existing) {
    throw ApiError.conflict("Already enrolled in this course", "ALREADY_ENROLLED");
  }

  const firstLesson = course.modules
    .sort((a, b) => a.order - b.order)
    .flatMap((m) => m.lessons.sort((a, b) => a.order - b.order))[0];

  await prisma.enrollment.create({
    data: {
      studentId,
      courseId: course.id,
      progress: 0,
      lastLessonId: firstLesson?.id ?? null,
    },
  });

  return { message: "Enrolled successfully", courseId: course.id };
}

export async function reorderModules(
  userId: string,
  role: Role,
  courseId: string,
  ids: string[],
) {
  const course = await getCourseOrThrow(courseId);
  if (!canManageCourse(userId, role, course.teacherId)) {
    throw ApiError.forbidden();
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.module.update({ where: { id, courseId: course.id }, data: { order: index } }),
    ),
  );

  return mapCourse(
    await prisma.course.findUniqueOrThrow({ where: { id: course.id }, include: courseInclude }),
    true,
  );
}

export async function reorderLessons(
  userId: string,
  role: Role,
  moduleId: string,
  ids: string[],
) {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: true },
  });

  if (!module) throw ApiError.notFound("Module not found");
  if (!canManageCourse(userId, role, module.course.teacherId)) {
    throw ApiError.forbidden();
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.lesson.update({ where: { id, moduleId: module.id }, data: { order: index } }),
    ),
  );

  return mapCourse(
    await prisma.course.findUniqueOrThrow({
      where: { id: module.courseId },
      include: courseInclude,
    }),
    true,
  );
}

export async function updateModule(
  userId: string,
  role: Role,
  moduleId: string,
  input: { title?: string; order?: number },
) {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: true },
  });

  if (!module) throw ApiError.notFound("Module not found");
  if (!canManageCourse(userId, role, module.course.teacherId)) {
    throw ApiError.forbidden();
  }

  await prisma.module.update({
    where: { id: moduleId },
    data: input,
  });

  return mapCourse(
    await prisma.course.findUniqueOrThrow({
      where: { id: module.courseId },
      include: courseInclude,
    }),
    true,
  );
}

export async function updateLesson(
  userId: string,
  role: Role,
  lessonId: string,
  input: {
    title?: string;
    description?: string;
    videoUrl?: string;
    duration?: number;
    order?: number;
  },
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });

  if (!lesson) throw ApiError.notFound("Lesson not found");
  if (!canManageCourse(userId, role, lesson.module.course.teacherId)) {
    throw ApiError.forbidden();
  }

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.videoUrl !== undefined && { videoUrl: input.videoUrl || null }),
      ...(input.duration !== undefined && { duration: input.duration }),
      ...(input.order !== undefined && { order: input.order }),
    },
  });

  return mapCourse(
    await prisma.course.findUniqueOrThrow({
      where: { id: lesson.module.courseId },
      include: courseInclude,
    }),
    true,
  );
}
