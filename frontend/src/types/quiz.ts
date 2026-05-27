export type QuestionType = "MCQ";

export interface Question {
  id: string;
  quizId: string;
  question: string;
  type: QuestionType;
  options: string[];
  correctAnswer?: string;
  points: number;
  order: number;
  createdAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  lessonId: string;
  timeLimit: number | null;
  passingScore: number;
  createdAt: string;
  updatedAt: string;
  questionCount: number;
  attemptCount?: number;
  questions?: Question[];
  bestScore?: number | null;
  passed?: boolean;
  attemptCountStudent?: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  score: number;
  passed: boolean;
  startedAt: string;
  completedAt: string | null;
  questionAttempts?: QuestionAttemptReview[];
}

export interface QuestionAttemptReview {
  id: string;
  questionId: string;
  selectedAnswer: string | null;
  correct: boolean;
  question?: string;
  options?: string[];
  correctAnswer?: string;
  points?: number;
}

export interface QuizAnalytics {
  quiz: Quiz;
  stats: {
    totalAttempts: number;
    passedCount: number;
    failedCount: number;
    passRate: number;
    averageScore: number;
  };
  recentAttempts: {
    id: string;
    studentName: string;
    studentEmail: string;
    score: number;
    passed: boolean;
    completedAt: string;
  }[];
}

export interface TeacherQuiz extends Quiz {
  lesson?: {
    id: string;
    title: string;
    module: {
      title: string;
      course: { id: string; title: string; slug: string };
    };
  };
}

export interface QuizPreview {
  quiz: Quiz;
  previousAttempts: QuizAttempt[];
  bestScore: number | null;
  hasPassed: boolean;
}

export interface ActiveQuizSession {
  attempt: QuizAttempt;
  quiz: Quiz;
  questions: Question[];
  timeLimit: number | null;
  passingScore: number;
}

export interface QuizResult {
  attempt: QuizAttempt;
  quiz: Quiz;
  passingScore: number;
  totalQuestions: number;
  correctCount: number;
}
