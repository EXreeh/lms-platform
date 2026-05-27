import { PrismaClient } from "../generated/client/index.js";
import bcrypt from "bcrypt";
import {
  DEMO_PASSWORD,
  seedCourses,
  seedQuizTemplates,
  seedStudents,
  seedTeachers,
  type SeedCourse,
} from "./seed-data.js";

const prisma = new PrismaClient();

function flattenLessons(course: { modules: { lessons: { id: string; order: number }[]; order: number }[] }) {
  return [...course.modules]
    .sort((a, b) => a.order - b.order)
    .flatMap((m) => [...m.lessons].sort((a, b) => a.order - b.order));
}

async function upsertUser(
  email: string,
  firstName: string,
  lastName: string,
  role: "STUDENT" | "TEACHER" | "ADMIN",
  passwordHash: string,
) {
  return prisma.user.upsert({
    where: { email },
    update: { firstName, lastName },
    create: { email, password: passwordHash, firstName, lastName, role, emailVerified: true },
  });
}

async function seedCourse(courseData: SeedCourse, teacherId: string) {
  const { modules, teacherEmail: _t, ...fields } = courseData;
  const course = await prisma.course.upsert({
    where: { slug: courseData.slug },
    update: { ...fields, teacherId },
    create: { ...fields, teacherId },
  });

  await prisma.module.deleteMany({ where: { courseId: course.id } });

  for (let mi = 0; mi < modules.length; mi++) {
    const mod = modules[mi];
    const module = await prisma.module.create({
      data: { title: mod.title, order: mi, courseId: course.id },
    });
    for (let li = 0; li < mod.lessons.length; li++) {
      const les = mod.lessons[li];
      await prisma.lesson.create({
        data: {
          title: les.title,
          description: les.description,
          videoUrl: les.videoUrl,
          duration: les.duration,
          order: li,
          moduleId: module.id,
        },
      });
    }
  }

  return prisma.course.findUniqueOrThrow({
    where: { id: course.id },
    include: { modules: { include: { lessons: true }, orderBy: { order: "asc" } } },
  });
}

async function main() {
  console.log("🌱 Seeding Cognitiax AI LMS demo data…");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const admin = await upsertUser("admin@cognitiax.ai", "Sam", "Rivera", "ADMIN", passwordHash);

  const teacherMap = new Map<string, string>();
  for (const t of seedTeachers) {
    const user = await upsertUser(t.email, t.firstName, t.lastName, "TEACHER", passwordHash);
    teacherMap.set(t.email, user.id);
  }

  const studentUsers = [];
  for (const s of seedStudents) {
    studentUsers.push(await upsertUser(s.email, s.firstName, s.lastName, "STUDENT", passwordHash));
  }

  const courseRecords: Awaited<ReturnType<typeof seedCourse>>[] = [];
  for (const data of seedCourses) {
    const teacherId = teacherMap.get(data.teacherEmail) ?? teacherMap.get("teacher@cognitiax.ai")!;
    courseRecords.push(await seedCourse(data, teacherId));
  }

  const courseBySlug = new Map(courseRecords.map((c) => [c.slug, c]));

  // Enrollments + progress
  const enrollmentPlan: { studentIndex: number; courseSlug: string; progressPct: number }[] = [
    { studentIndex: 0, courseSlug: "intro-ai-machine-learning", progressPct: 40 },
    { studentIndex: 0, courseSlug: "full-stack-web-development", progressPct: 15 },
    { studentIndex: 0, courseSlug: "cybersecurity-essentials", progressPct: 100 },
    { studentIndex: 1, courseSlug: "data-science-python", progressPct: 55 },
    { studentIndex: 1, courseSlug: "sql-for-data-analysts", progressPct: 80 },
    { studentIndex: 2, courseSlug: "aws-cloud-practitioner", progressPct: 25 },
    { studentIndex: 2, courseSlug: "docker-container-orchestration", progressPct: 60 },
    { studentIndex: 3, courseSlug: "ui-ux-design-fundamentals", progressPct: 70 },
    { studentIndex: 3, courseSlug: "modern-javascript-mastery", progressPct: 100 },
    { studentIndex: 4, courseSlug: "react-native-mobile-dev", progressPct: 30 },
    { studentIndex: 4, courseSlug: "deep-learning-pytorch", progressPct: 10 },
  ];

  for (const plan of enrollmentPlan) {
    const course = courseBySlug.get(plan.courseSlug);
    const student = studentUsers[plan.studentIndex];
    if (!course || !student) continue;

    const lessons = flattenLessons(course);
    const completed = plan.progressPct >= 100;
    const completeCount = completed
      ? lessons.length
      : Math.floor((lessons.length * plan.progressPct) / 100);

    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
      update: { progressPercentage: plan.progressPct, completed },
      create: {
        studentId: student.id,
        courseId: course.id,
        progressPercentage: plan.progressPct,
        completed,
      },
    });

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const isDone = i < completeCount;
      await prisma.lessonProgress.upsert({
        where: { studentId_lessonId: { studentId: student.id, lessonId: lesson.id } },
        update: {
          completed: isDone,
          watchedDuration: isDone ? 600 : i === completeCount ? 300 : 0,
          completedAt: isDone ? new Date() : null,
        },
        create: {
          studentId: student.id,
          lessonId: lesson.id,
          completed: isDone,
          watchedDuration: isDone ? 600 : i === completeCount ? 300 : 0,
          completedAt: isDone ? new Date() : null,
        },
      });
    }
  }

  // Quizzes
  for (const tmpl of seedQuizTemplates) {
    const course = courseBySlug.get(tmpl.courseSlug);
    if (!course) continue;
    const lessons = flattenLessons(course);
    const lesson = lessons[tmpl.lessonIndex];
    if (!lesson) continue;

    const quiz = await prisma.quiz.upsert({
      where: { id: `seed-quiz-${tmpl.courseSlug}-${tmpl.lessonIndex}` },
      update: { title: tmpl.title, lessonId: lesson.id },
      create: {
        id: `seed-quiz-${tmpl.courseSlug}-${tmpl.lessonIndex}`,
        title: tmpl.title,
        description: tmpl.description ?? null,
        lessonId: lesson.id,
        timeLimit: tmpl.timeLimit,
        passingScore: tmpl.passingScore,
      },
    });

    await prisma.question.deleteMany({ where: { quizId: quiz.id } });
    for (let qi = 0; qi < tmpl.questions.length; qi++) {
      const q = tmpl.questions[qi];
      await prisma.question.create({
        data: {
          quizId: quiz.id,
          question: q.question,
          type: "MCQ",
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: 1,
          order: qi,
        },
      });
    }
  }

  // Sample passed quiz attempt for primary student
  const aiQuiz = await prisma.quiz.findFirst({
    where: { id: "seed-quiz-intro-ai-machine-learning-1" },
    include: { questions: true },
  });
  if (aiQuiz && studentUsers[0]) {
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: aiQuiz.id,
        studentId: studentUsers[0].id,
        score: 66.7,
        passed: false,
        completedAt: new Date(),
      },
    });
    for (const q of aiQuiz.questions) {
      await prisma.questionAttempt.create({
        data: {
          quizAttemptId: attempt.id,
          questionId: q.id,
          selectedAnswer: (q.options as string[])[0],
          correct: q.correctAnswer === (q.options as string[])[0],
        },
      });
    }
  }

  console.log("✅ Seed complete!");
  console.log(`   ${seedCourses.length} courses · ${seedTeachers.length} teachers · ${seedStudents.length} students`);
  console.log("   Password for all demo accounts:", DEMO_PASSWORD);
  console.log("   Primary accounts:");
  console.log("     teacher@cognitiax.ai · admin@cognitiax.ai · student@cognitiax.ai");
  console.log(`   (Admin id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
