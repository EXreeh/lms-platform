"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { QuizCard } from "@/components/quizzes/quiz-card";
import { QuizSkeleton } from "@/components/quizzes/progress-indicator";
import { Button } from "@/components/ui/button";
import { fetchTeacherQuizzes } from "@/lib/quizzes-api";
import { formatApiError } from "@/lib/format-api-error";
import type { TeacherQuiz } from "@/types/quiz";
import { ApiClientError } from "@/lib/api";
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";

export default function TeacherQuizzesPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { error: toastError } = useToast();
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuizzes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchTeacherQuizzes();
      const list = res.data?.quizzes ?? [];
      if (process.env.NODE_ENV === "development") {
        console.info("[Quiz] list loaded", { count: list.length });
      }
      setQuizzes(list);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        const status = err instanceof ApiClientError ? err.status : "unknown";
        console.error("[Quiz] list failed", { status, err });
      }
      const msg = formatApiError(err, "Failed to load quizzes");
      setError(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;
    void loadQuizzes();
  }, [authLoading, isAuthenticated, loadQuizzes]);

  return (
    <DashboardShell
      title="Quiz Manager"
      description="Create assessments, add MCQ questions, and review student performance."
      badge="Assessments"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex justify-end">
            <Link href="/dashboard/teacher/quizzes/new">
              <Button variant="gold">+ Create quiz</Button>
            </Link>
          </div>

          {isLoading || authLoading ? (
            <QuizSkeleton />
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/40">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => void loadQuizzes()}>
                Retry
              </Button>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-4xl">📝</p>
              <h2 className="mt-4 font-serif text-xl font-bold">No quizzes yet</h2>
              <p className="mt-2 text-muted-foreground">
                Attach a quiz to any lesson to assess student understanding.
              </p>
              <Link href="/dashboard/teacher/quizzes/new" className="mt-6 inline-block">
                <Button variant="gold">Create your first quiz</Button>
              </Link>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-5 sm:grid-cols-2"
            >
              {quizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  href={`/dashboard/teacher/quizzes/${quiz.id}/edit`}
                  subtitle={
                    quiz.lesson
                      ? `${quiz.lesson.module.course.title} · ${quiz.lesson.title}`
                      : undefined
                  }
                  showStats
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
