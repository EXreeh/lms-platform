"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { QuizCard } from "@/components/quizzes/quiz-card";
import { QuizSkeleton } from "@/components/quizzes/progress-indicator";
import { Button } from "@/components/ui/button";
import { fetchTeacherQuizzes } from "@/lib/quizzes-api";
import type { TeacherQuiz } from "@/types/quiz";
import { ApiClientError } from "@/lib/api";

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchTeacherQuizzes();
        setQuizzes(res.data.quizzes);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Failed to load quizzes");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

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

          {isLoading ? (
            <QuizSkeleton />
          ) : error ? (
            <p className="text-red-600">{error}</p>
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
