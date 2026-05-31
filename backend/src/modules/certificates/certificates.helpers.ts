import type { Certificate, Course, User } from "@lms/database";
import { prisma } from "../../config/database.js";
import { activeEntityFilter } from "../courses/courses.helpers.js";
import { flattenCourseLessons } from "../learning/learning.mapper.js";

export interface CertificateEligibility {
  eligible: boolean;
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  passedQuizzes: number;
  lessonsComplete: boolean;
  quizzesPassed: boolean;
  alreadyIssued: boolean;
  certificateId?: string;
  reasons: string[];
}

export async function getCertificateEligibility(
  studentId: string,
  courseIdOrSlug: string,
): Promise<CertificateEligibility> {
  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }],
      status: "APPROVED",
      deleteStatus: "ACTIVE",
    },
    include: {
      modules: {
        where: activeEntityFilter(),
        include: {
          lessons: {
            where: activeEntityFilter(),
            include: {
              quizzes: { where: activeEntityFilter() },
            },
          },
        },
      },
    },
  });

  if (!course) {
    return {
      eligible: false,
      totalLessons: 0,
      completedLessons: 0,
      totalQuizzes: 0,
      passedQuizzes: 0,
      lessonsComplete: false,
      quizzesPassed: false,
      alreadyIssued: false,
      reasons: ["Course not found or not published"],
    };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: course.id } },
  });
  if (!enrollment) {
    return {
      eligible: false,
      totalLessons: 0,
      completedLessons: 0,
      totalQuizzes: 0,
      passedQuizzes: 0,
      lessonsComplete: false,
      quizzesPassed: false,
      alreadyIssued: false,
      reasons: ["You must enroll in this course first"],
    };
  }

  const existing = await prisma.certificate.findUnique({
    where: { studentId_courseId: { studentId, courseId: course.id } },
  });

  const lessons = flattenCourseLessons(course.modules);
  const lessonIds = lessons.map((l) => l.id);
  const quizzes = course.modules.flatMap((m) =>
    m.lessons.flatMap((l) => l.quizzes),
  );
  const quizIds = quizzes.map((q) => q.id);

  const completedLessons =
    lessonIds.length === 0
      ? 0
      : await prisma.lessonProgress.count({
          where: { studentId, completed: true, lessonId: { in: lessonIds } },
        });

  let passedQuizzes = 0;
  if (quizIds.length > 0) {
    const passed = await prisma.quizAttempt.findMany({
      where: {
        studentId,
        quizId: { in: quizIds },
        passed: true,
        completedAt: { not: null },
      },
      distinct: ["quizId"],
      select: { quizId: true },
    });
    passedQuizzes = passed.length;
  }

  const lessonsComplete = lessonIds.length > 0 && completedLessons >= lessonIds.length;
  const quizzesPassed = quizIds.length === 0 || passedQuizzes >= quizIds.length;

  const reasons: string[] = [];
  if (lessonIds.length === 0) reasons.push("Course has no lessons");
  if (!lessonsComplete) {
    reasons.push(`Complete all lessons (${completedLessons}/${lessonIds.length})`);
  }
  if (!quizzesPassed) {
    reasons.push(`Pass all required quizzes (${passedQuizzes}/${quizIds.length})`);
  }

  const eligible = lessonsComplete && quizzesPassed && !existing;

  return {
    eligible,
    totalLessons: lessonIds.length,
    completedLessons,
    totalQuizzes: quizIds.length,
    passedQuizzes,
    lessonsComplete,
    quizzesPassed,
    alreadyIssued: Boolean(existing),
    certificateId: existing?.id,
    reasons: existing ? ["Certificate already issued"] : reasons,
  };
}

export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CXAI-${year}-${suffix}`;
}

export function generateVerificationCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export type CertificateWithRelations = Certificate & {
  student: Pick<User, "id" | "firstName" | "lastName" | "email">;
  course: Pick<Course, "id" | "title" | "slug" | "category" | "level">;
};

export interface MappedCertificate {
  id: string;
  studentId: string;
  courseId: string;
  certificateNumber: string;
  verificationCode: string;
  issuedAt: string;
  pdfUrl: string | null;
  student: { id: string; name: string; email: string };
  course: Pick<Course, "id" | "title" | "slug" | "category" | "level">;
}

export function mapCertificate(cert: CertificateWithRelations): MappedCertificate {
  return {
    id: cert.id,
    studentId: cert.studentId,
    courseId: cert.courseId,
    certificateNumber: cert.certificateNumber,
    verificationCode: cert.verificationCode,
    issuedAt: cert.issuedAt.toISOString(),
    pdfUrl: cert.pdfUrl,
    student: {
      id: cert.student.id,
      name: `${cert.student.firstName} ${cert.student.lastName}`.trim(),
      email: cert.student.email,
    },
    course: cert.course,
  };
}
