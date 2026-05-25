import { PrismaClient } from "../generated/client/index.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Cognitiax AI LMS demo data…");

  const passwordHash = await bcrypt.hash("Password123!", 12);

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@cognitiax.ai" },
    update: {},
    create: {
      email: "teacher@cognitiax.ai",
      password: passwordHash,
      firstName: "Alex",
      lastName: "Morgan",
      role: "TEACHER",
      emailVerified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@cognitiax.ai" },
    update: {},
    create: {
      email: "admin@cognitiax.ai",
      password: passwordHash,
      firstName: "Sam",
      lastName: "Rivera",
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@cognitiax.ai" },
    update: {},
    create: {
      email: "student@cognitiax.ai",
      password: passwordHash,
      firstName: "Jordan",
      lastName: "Lee",
      role: "STUDENT",
      emailVerified: true,
    },
  });

  const courseData = [
    {
      title: "Introduction to AI & Machine Learning",
      slug: "intro-ai-machine-learning",
      description:
        "Master the fundamentals of artificial intelligence and machine learning. Build real models, understand neural networks, and apply AI to solve practical problems.",
      thumbnail: "https://images.unsplash.com/photo-1677440866019-2178eced5449?w=800&q=80",
      price: 49.99,
      category: "AI & Machine Learning",
      level: "BEGINNER" as const,
      published: true,
      modules: [
        {
          title: "Getting Started",
          lessons: [
            {
              title: "What is Artificial Intelligence?",
              description: "Overview of AI history and modern applications.",
              videoUrl: "https://www.youtube.com/watch?v=ad79nYk2keg",
              duration: 720,
            },
            {
              title: "Types of Machine Learning",
              description: "Supervised, unsupervised, and reinforcement learning.",
              videoUrl: "https://www.youtube.com/watch?v=1FZDBA0G17A",
              duration: 900,
            },
          ],
        },
        {
          title: "Building Your First Model",
          lessons: [
            {
              title: "Data Preparation",
              description: "Cleaning and preparing datasets for training.",
              videoUrl: "https://www.youtube.com/watch?v=aircAruvnKk",
              duration: 840,
            },
          ],
        },
      ],
    },
    {
      title: "Full-Stack Web Development",
      slug: "full-stack-web-development",
      description:
        "Learn to build modern web applications with React, Node.js, and PostgreSQL. From frontend to backend deployment.",
      thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
      price: 39.99,
      category: "Development",
      level: "INTERMEDIATE" as const,
      published: true,
      modules: [
        {
          title: "Frontend Foundations",
          lessons: [
            {
              title: "React Components Deep Dive",
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 600,
            },
          ],
        },
      ],
    },
    {
      title: "Data Science with Python",
      slug: "data-science-python",
      description: "Draft course — advanced analytics, pandas, and visualization techniques.",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
      price: 59.99,
      category: "Data Science",
      level: "ADVANCED" as const,
      published: false,
      modules: [],
    },
  ];

  for (const data of courseData) {
    const { modules, ...courseFields } = data;
    const course = await prisma.course.upsert({
      where: { slug: data.slug },
      update: { ...courseFields, teacherId: teacher.id },
      create: { ...courseFields, teacherId: teacher.id },
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
            description: les.description ?? null,
            videoUrl: les.videoUrl,
            duration: les.duration,
            order: li,
            moduleId: module.id,
          },
        });
      }
    }
  }

  const publishedCourse = await prisma.course.findFirst({
    where: { slug: "intro-ai-machine-learning" },
    include: { modules: { include: { lessons: true } } },
  });

  if (publishedCourse) {
    const firstLesson = publishedCourse.modules[0]?.lessons[0];
    await prisma.enrollment.upsert({
      where: {
        studentId_courseId: { studentId: student.id, courseId: publishedCourse.id },
      },
      update: { progress: 35, lastLessonId: firstLesson?.id ?? null },
      create: {
        studentId: student.id,
        courseId: publishedCourse.id,
        progress: 35,
        lastLessonId: firstLesson?.id ?? null,
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log("   Teacher: teacher@cognitiax.ai / Password123!");
  console.log("   Admin:   admin@cognitiax.ai / Password123!");
  console.log("   Student: student@cognitiax.ai / Password123!");
  console.log(`   (Admin user id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
