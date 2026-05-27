import type { Role } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { calculateScore, mapQuestion, mapQuiz, mapQuizAttempt } from "./quizzes.mapper.js";
import type {
  CreateQuestionInput,
  CreateQuizInput,
  SubmitQuizInput,
  UpdateQuestionInput,
  UpdateQuizInput,
} from "./quizzes.validation.js";

const quizInclude = {
  questions: { orderBy: { order: "asc" as const } },
  _count: { select: { attempts: true, questions: true } },
} as const;

async function getLessonWithCourse(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { include: { course: true } },
      quizzes: { include: quizInclude },
    },
  });

  if (!lesson) throw ApiError.notFound("Lesson not found");
  return lesson;
}

async function getQuizOrThrow(quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { orderBy: { order: "asc" } },
      lesson: { include: { module: { include: { course: true } } } },
      _count: { select: { attempts: true, questions: true } },
    },
  });

  if (!quiz) throw ApiError.notFound("Quiz not found");
  return quiz;
}

function canManageCourse(userId: string, role: Role, teacherId: string): boolean {
  return role === "ADMIN" || (role === "TEACHER" && userId === teacherId);
}

async function assertStudentEnrolled(studentId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!enrollment) {
    throw ApiError.forbidden("You must be enrolled in this course to take the quiz");
  }
}

function validateQuestionInput(input: CreateQuestionInput | UpdateQuestionInput) {
  if (input.options && input.correctAnswer && !input.options.includes(input.correctAnswer)) {
    throw ApiError.badRequest("Correct answer must be one of the provided options");
  }
}

export async function createQuiz(userId: string, role: Role, input: CreateQuizInput) {
  const lesson = await getLessonWithCourse(input.lessonId);
  if (!canManageCourse(userId, role, lesson.module.course.teacherId)) {
    throw ApiError.forbidden();
  }

  const quiz = await prisma.quiz.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      lessonId: input.lessonId,
      timeLimit: input.timeLimit ?? null,
      passingScore: input.passingScore,
    },
    include: quizInclude,
  });

  return mapQuiz(quiz, true);
}

export async function updateQuiz(
  userId: string,
  role: Role,
  quizId: string,
  input: UpdateQuizInput,
) {
  const quiz = await getQuizOrThrow(quizId);
  if (!canManageCourse(userId, role, quiz.lesson.module.course.teacherId)) {
    throw ApiError.forbidden();
  }

  const updated = await prisma.quiz.update({
    where: { id: quizId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description ?? null }),
      ...(input.timeLimit !== undefined && { timeLimit: input.timeLimit ?? null }),
      ...(input.passingScore !== undefined && { passingScore: input.passingScore }),
    },
    include: quizInclude,
  });

  return mapQuiz(updated, true);
}

export async function deleteQuiz(userId: string, role: Role, quizId: string) {
  const quiz = await getQuizOrThrow(quizId);
  if (!canManageCourse(userId, role, quiz.lesson.module.course.teacherId)) {
    throw ApiError.forbidden();
  }

  await prisma.quiz.delete({ where: { id: quizId } });
  return { message: "Quiz deleted" };
}

export async function getQuiz(userId: string, role: Role, quizId: string) {
  const quiz = await getQuizOrThrow(quizId);
  const isStaff =
    role === "ADMIN" ||
    (role === "TEACHER" && canManageCourse(userId, role, quiz.lesson.module.course.teacherId));

  if (!isStaff) {
    throw ApiError.forbidden("Use quiz preview to access quiz details as a student");
  }

  return mapQuiz(quiz, true);
}

export async function listQuizzesByLesson(userId: string, role: Role, lessonId: string) {
  const lesson = await getLessonWithCourse(lessonId);
  if (!canManageCourse(userId, role, lesson.module.course.teacherId)) {
    throw ApiError.forbidden();
  }

  const quizzes = await prisma.quiz.findMany({
    where: { lessonId },
    include: quizInclude,
    orderBy: { createdAt: "desc" },
  });

  return quizzes.map((q) => mapQuiz(q, true));
}

export async function listTeacherQuizzes(userId: string, role: Role) {
  if (role !== "TEACHER" && role !== "ADMIN") {
    throw ApiError.forbidden();
  }

  const where =
    role === "ADMIN"
      ? {}
      : { lesson: { module: { course: { teacherId: userId } } } };

  const quizzes = await prisma.quiz.findMany({
    where,
    include: {
      ...quizInclude,
      lesson: {
        select: {
          id: true,
          title: true,
          module: {
            select: {
              title: true,
              course: { select: { id: true, title: true, slug: true } },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return quizzes.map((q) => ({
    ...mapQuiz(q, true),
    lesson: q.lesson,
  }));
}

export async function addQuestion(
  userId: string,
  role: Role,
  quizId: string,
  input: CreateQuestionInput,
) {
  validateQuestionInput(input);
  const quiz = await getQuizOrThrow(quizId);
  if (!canManageCourse(userId, role, quiz.lesson.module.course.teacherId)) {
    throw ApiError.forbidden();
  }

  const order =
    input.order ??
    (await prisma.question.count({ where: { quizId } }));

  const question = await prisma.question.create({
    data: {
      quizId,
      question: input.question,
      type: input.type,
      options: input.options,
      correctAnswer: input.correctAnswer,
      points: input.points,
      order,
    },
  });

  return mapQuestion(question, true);
}

export async function updateQuestion(
  userId: string,
  role: Role,
  questionId: string,
  input: UpdateQuestionInput,
) {
  validateQuestionInput(input);

  const existing = await prisma.question.findUnique({
    where: { id: questionId },
    include: { quiz: { include: { lesson: { include: { module: { include: { course: true } } } } } } },
  });

  if (!existing) throw ApiError.notFound("Question not found");
  if (!canManageCourse(userId, role, existing.quiz.lesson.module.course.teacherId)) {
    throw ApiError.forbidden();
  }

  const options = input.options ?? (existing.options as string[]);
  const correctAnswer = input.correctAnswer ?? existing.correctAnswer;
  if (!options.includes(correctAnswer)) {
    throw ApiError.badRequest("Correct answer must be one of the provided options");
  }

  const question = await prisma.question.update({
    where: { id: questionId },
    data: {
      ...(input.question !== undefined && { question: input.question }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.options !== undefined && { options: input.options }),
      ...(input.correctAnswer !== undefined && { correctAnswer: input.correctAnswer }),
      ...(input.points !== undefined && { points: input.points }),
      ...(input.order !== undefined && { order: input.order }),
    },
  });

  return mapQuestion(question, true);
}

export async function deleteQuestion(userId: string, role: Role, questionId: string) {
  const existing = await prisma.question.findUnique({
    where: { id: questionId },
    include: { quiz: { include: { lesson: { include: { module: { include: { course: true } } } } } } },
  });

  if (!existing) throw ApiError.notFound("Question not found");
  if (!canManageCourse(userId, role, existing.quiz.lesson.module.course.teacherId)) {
    throw ApiError.forbidden();
  }

  await prisma.question.delete({ where: { id: questionId } });
  return { message: "Question deleted" };
}

export async function getQuizAnalytics(userId: string, role: Role, quizId: string) {
  const quiz = await getQuizOrThrow(quizId);
  if (!canManageCourse(userId, role, quiz.lesson.module.course.teacherId)) {
    throw ApiError.forbidden();
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, completedAt: { not: null } },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { completedAt: "desc" },
  });

  const totalAttempts = attempts.length;
  const passedCount = attempts.filter((a) => a.passed).length;
  const avgScore =
    totalAttempts > 0
      ? Math.round((attempts.reduce((s, a) => s + a.score, 0) / totalAttempts) * 10) / 10
      : 0;

  return {
    quiz: mapQuiz(quiz, true),
    stats: {
      totalAttempts,
      passedCount,
      failedCount: totalAttempts - passedCount,
      passRate: totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 1000) / 10 : 0,
      averageScore: avgScore,
    },
    recentAttempts: attempts.slice(0, 10).map((a) => ({
      id: a.id,
      studentName: `${a.student.firstName} ${a.student.lastName}`.trim(),
      studentEmail: a.student.email,
      score: a.score,
      passed: a.passed,
      completedAt: a.completedAt!.toISOString(),
    })),
  };
}

export async function getQuizPreview(studentId: string, quizId: string) {
  const quiz = await getQuizOrThrow(quizId);
  const courseId = quiz.lesson.module.course.id;

  if (!quiz.lesson.module.course.published) {
    throw ApiError.notFound("Quiz not found");
  }

  await assertStudentEnrolled(studentId, courseId);

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, studentId },
    orderBy: { startedAt: "desc" },
  });

  const bestAttempt = attempts
    .filter((a) => a.completedAt)
    .sort((a, b) => b.score - a.score)[0];

  return {
    quiz: mapQuiz(quiz, false),
    previousAttempts: attempts.map((a) => mapQuizAttempt(a)),
    bestScore: bestAttempt?.score ?? null,
    hasPassed: attempts.some((a) => a.passed),
  };
}

export async function startQuiz(studentId: string, quizId: string) {
  const quiz = await getQuizOrThrow(quizId);
  const courseId = quiz.lesson.module.course.id;

  if (!quiz.lesson.module.course.published) {
    throw ApiError.notFound("Quiz not found");
  }

  if (quiz.questions.length === 0) {
    throw ApiError.badRequest("This quiz has no questions yet");
  }

  await assertStudentEnrolled(studentId, courseId);

  const inProgress = await prisma.quizAttempt.findFirst({
    where: { quizId, studentId, completedAt: null },
  });

  if (inProgress) {
    return getAttemptForStudent(studentId, inProgress.id);
  }

  const attempt = await prisma.quizAttempt.create({
    data: { quizId, studentId },
  });

  return {
    attempt: mapQuizAttempt(attempt),
    quiz: mapQuiz(quiz, false),
    questions: quiz.questions.map((q) => mapQuestion(q, false)),
    timeLimit: quiz.timeLimit,
    passingScore: quiz.passingScore,
  };
}

export async function getAttemptForStudent(studentId: string, attemptId: string) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: { include: { questions: { orderBy: { order: "asc" } } } },
      questionAttempts: true,
    },
  });

  if (!attempt || attempt.studentId !== studentId) {
    throw ApiError.notFound("Attempt not found");
  }

  if (attempt.completedAt) {
    throw ApiError.badRequest("This attempt is already completed", "ATTEMPT_COMPLETED");
  }

  if (attempt.quiz.timeLimit) {
    const elapsed = (Date.now() - attempt.startedAt.getTime()) / 1000;
    if (elapsed > attempt.quiz.timeLimit) {
      throw ApiError.badRequest("Time limit exceeded", "TIME_EXPIRED");
    }
  }

  return {
    attempt: mapQuizAttempt(attempt),
    quiz: mapQuiz(attempt.quiz, false),
    questions: attempt.quiz.questions.map((q) => mapQuestion(q, false)),
    timeLimit: attempt.quiz.timeLimit,
    passingScore: attempt.quiz.passingScore,
  };
}

export async function submitQuiz(
  studentId: string,
  attemptId: string,
  input: SubmitQuizInput,
) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: { include: { questions: { orderBy: { order: "asc" } } } },
    },
  });

  if (!attempt || attempt.studentId !== studentId) {
    throw ApiError.notFound("Attempt not found");
  }

  if (attempt.completedAt) {
    throw ApiError.badRequest("Attempt already submitted", "ALREADY_SUBMITTED");
  }

  if (attempt.quiz.timeLimit) {
    const elapsed = (Date.now() - attempt.startedAt.getTime()) / 1000;
    if (elapsed > attempt.quiz.timeLimit + 30) {
      throw ApiError.badRequest("Time limit exceeded", "TIME_EXPIRED");
    }
  }

  const questionIds = new Set(attempt.quiz.questions.map((q) => q.id));
  for (const answer of input.answers) {
    if (!questionIds.has(answer.questionId)) {
      throw ApiError.badRequest("Invalid question in submission");
    }
  }

  const { score, results } = calculateScore(attempt.quiz.questions, input.answers);
  const passed = score >= attempt.quiz.passingScore;

  await prisma.$transaction([
    ...results.map((r) =>
      prisma.questionAttempt.upsert({
        where: {
          quizAttemptId_questionId: {
            quizAttemptId: attemptId,
            questionId: r.questionId,
          },
        },
        create: {
          quizAttemptId: attemptId,
          questionId: r.questionId,
          selectedAnswer: r.selectedAnswer,
          correct: r.correct,
        },
        update: {
          selectedAnswer: r.selectedAnswer,
          correct: r.correct,
        },
      }),
    ),
    prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { score, passed, completedAt: new Date() },
    }),
  ]);

  return getAttemptResult(studentId, attemptId);
}

export async function getAttemptResult(studentId: string, attemptId: string) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: { include: { questions: { orderBy: { order: "asc" } } } },
      questionAttempts: { include: { question: true } },
    },
  });

  if (!attempt || attempt.studentId !== studentId) {
    throw ApiError.notFound("Attempt not found");
  }

  if (!attempt.completedAt) {
    throw ApiError.badRequest("Attempt not yet completed");
  }

  return {
    attempt: mapQuizAttempt(attempt, true),
    quiz: mapQuiz(attempt.quiz, false),
    passingScore: attempt.quiz.passingScore,
    totalQuestions: attempt.quiz.questions.length,
    correctCount: attempt.questionAttempts.filter((qa) => qa.correct).length,
  };
}

export async function listLessonQuizzesForStudent(studentId: string, lessonId: string) {
  const lesson = await getLessonWithCourse(lessonId);
  if (!lesson.module.course.published) {
    throw ApiError.notFound("Lesson not found");
  }

  await assertStudentEnrolled(studentId, lesson.module.course.id);

  const quizzes = await prisma.quiz.findMany({
    where: { lessonId },
    include: quizInclude,
    orderBy: { createdAt: "asc" },
  });

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      studentId,
      quizId: { in: quizzes.map((q) => q.id) },
      completedAt: { not: null },
    },
  });

  const attemptMap = new Map<string, typeof attempts>();
  for (const a of attempts) {
    const list = attemptMap.get(a.quizId) ?? [];
    list.push(a);
    attemptMap.set(a.quizId, list);
  }

  return quizzes.map((q) => {
    const studentAttempts = attemptMap.get(q.id) ?? [];
    const best = studentAttempts.sort((a, b) => b.score - a.score)[0];
    return {
      ...mapQuiz(q, false),
      bestScore: best?.score ?? null,
      passed: studentAttempts.some((a) => a.passed),
      attemptCount: studentAttempts.length,
    };
  });
}
