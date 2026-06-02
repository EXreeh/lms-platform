import type {
  Quiz,
  Question,
  TeacherQuiz,
  QuizAnalytics,
  QuizPreview,
  ActiveQuizSession,
  QuizResult,
} from "@/types/quiz";
import { apiRequest } from "./api";

export function fetchTeacherQuizzes() {
  return apiRequest<{ success: boolean; data: { quizzes: TeacherQuiz[] } }>("/quizzes/mine", {
    method: "GET",
    auth: true,
  });
}

export function fetchLessonQuizzes(lessonId: string) {
  return apiRequest<{ success: boolean; data: { quizzes: Quiz[] } }>(
    `/quizzes/lessons/${lessonId}`,
    { method: "GET", auth: true },
  );
}

export function fetchQuiz(quizId: string) {
  return apiRequest<{ success: boolean; data: { quiz: Quiz } }>(`/quizzes/${quizId}`, {
    method: "GET",
    auth: true,
  });
}

export function createQuiz(data: {
  title: string;
  description?: string;
  lessonId: string;
  timeLimit?: number | null;
  passingScore?: number;
}) {
  return apiRequest<{ success: boolean; data: { quiz: Quiz } }>("/quizzes", {
    method: "POST",
    body: data,
    auth: true,
  });
}

export function updateQuiz(
  quizId: string,
  data: Partial<{
    title: string;
    description: string;
    timeLimit: number | null;
    passingScore: number;
  }>,
) {
  return apiRequest<{ success: boolean; data: { quiz: Quiz } }>(`/quizzes/${quizId}`, {
    method: "PATCH",
    body: data,
    auth: true,
  });
}

export function deleteQuiz(quizId: string) {
  return apiRequest<{ success: boolean; message: string; pendingApproval?: boolean }>(
    `/quizzes/${quizId}`,
    { method: "DELETE", auth: true },
  );
}

export function addQuestion(
  quizId: string,
  data: {
    question: string;
    options: string[];
    correctAnswer: string;
    points?: number;
  },
) {
  return apiRequest<{ success: boolean; data: { question: Question } }>(
    `/quizzes/${quizId}/questions`,
    { method: "POST", body: { ...data, type: "MCQ" }, auth: true },
  );
}

export function deleteQuestion(questionId: string) {
  return apiRequest<{ success: boolean; message: string }>(
    `/quizzes/questions/${questionId}`,
    { method: "DELETE", auth: true },
  );
}

export function updateQuestion(
  questionId: string,
  data: Partial<{
    question: string;
    options: string[];
    correctAnswer: string;
    points: number;
  }>,
) {
  return apiRequest<{ success: boolean; data: { question: Question } }>(
    `/quizzes/questions/${questionId}`,
    { method: "PATCH", body: data, auth: true },
  );
}

export function fetchQuizAnalytics(quizId: string) {
  return apiRequest<{ success: boolean; data: QuizAnalytics }>(
    `/quizzes/${quizId}/analytics`,
    { method: "GET", auth: true },
  );
}

export function fetchLessonQuizzesStudent(lessonId: string) {
  return apiRequest<{ success: boolean; data: { quizzes: Quiz[] } }>(
    `/quizzes/lessons/${lessonId}/student`,
    { method: "GET", auth: true },
  );
}

export function fetchQuizPreview(quizId: string) {
  return apiRequest<{ success: boolean; data: QuizPreview }>(`/quizzes/${quizId}/preview`, {
    method: "GET",
    auth: true,
  });
}

export function startQuiz(quizId: string) {
  return apiRequest<{ success: boolean; data: ActiveQuizSession }>(
    `/quizzes/${quizId}/start`,
    { method: "POST", auth: true },
  );
}

export function fetchQuizAttempt(attemptId: string) {
  return apiRequest<{ success: boolean; data: ActiveQuizSession }>(
    `/quiz-attempts/${attemptId}`,
    { method: "GET", auth: true },
  );
}

export function submitQuizAttempt(
  attemptId: string,
  answers: { questionId: string; selectedAnswer: string }[],
) {
  return apiRequest<{ success: boolean; data: QuizResult }>(
    `/quiz-attempts/${attemptId}/submit`,
    { method: "POST", body: { answers }, auth: true },
  );
}

export function fetchQuizResult(attemptId: string) {
  return apiRequest<{ success: boolean; data: QuizResult }>(
    `/quiz-attempts/${attemptId}/result`,
    { method: "GET", auth: true },
  );
}
