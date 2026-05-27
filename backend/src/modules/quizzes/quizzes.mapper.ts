import type { Question, QuestionType, Quiz, QuizAttempt, QuestionAttempt } from "@lms/database";

export function mapQuestion(q: Question, includeAnswer = false) {
  return {
    id: q.id,
    quizId: q.quizId,
    question: q.question,
    type: q.type as QuestionType,
    options: q.options as string[],
    ...(includeAnswer && { correctAnswer: q.correctAnswer }),
    points: q.points,
    order: q.order,
    createdAt: q.createdAt.toISOString(),
  };
}

export function mapQuiz(
  quiz: Quiz & { questions?: Question[]; _count?: { attempts: number; questions: number } },
  includeAnswers = false,
) {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    lessonId: quiz.lessonId,
    timeLimit: quiz.timeLimit,
    passingScore: quiz.passingScore,
    createdAt: quiz.createdAt.toISOString(),
    updatedAt: quiz.updatedAt.toISOString(),
    questionCount: quiz._count?.questions ?? quiz.questions?.length ?? 0,
    attemptCount: quiz._count?.attempts ?? 0,
    questions: quiz.questions
      ?.sort((a, b) => a.order - b.order)
      .map((q) => mapQuestion(q, includeAnswers)),
  };
}

export function mapQuizAttempt(
  attempt: QuizAttempt & {
    questionAttempts?: (QuestionAttempt & { question?: Question })[];
    quiz?: Quiz;
  },
  includeReview = false,
) {
  return {
    id: attempt.id,
    quizId: attempt.quizId,
    studentId: attempt.studentId,
    score: attempt.score,
    passed: attempt.passed,
    startedAt: attempt.startedAt.toISOString(),
    completedAt: attempt.completedAt?.toISOString() ?? null,
    quiz: attempt.quiz ? mapQuiz(attempt.quiz) : undefined,
    questionAttempts: attempt.questionAttempts?.map((qa) => ({
      id: qa.id,
      questionId: qa.questionId,
      selectedAnswer: qa.selectedAnswer,
      correct: qa.correct,
      ...(includeReview &&
        qa.question && {
          question: qa.question.question,
          options: qa.question.options as string[],
          correctAnswer: qa.question.correctAnswer,
          points: qa.question.points,
        }),
    })),
  };
}

export function calculateScore(
  questions: Question[],
  answers: { questionId: string; selectedAnswer: string }[],
) {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedAnswer]));
  let earned = 0;
  let total = 0;

  const results = questions.map((q) => {
    total += q.points;
    const selected = answerMap.get(q.id) ?? null;
    const correct = selected === q.correctAnswer;
    if (correct) earned += q.points;
    return { questionId: q.id, selectedAnswer: selected, correct };
  });

  const score = total > 0 ? Math.round((earned / total) * 1000) / 10 : 0;

  return { score, earned, total, results };
}
