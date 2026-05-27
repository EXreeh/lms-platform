"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import { PageBackground } from "@/components/layout/page-background";
import { Button } from "@/components/ui/button";
import { QuizSkeleton } from "@/components/quizzes/progress-indicator";
import { fetchQuizPreview, startQuiz } from "@/lib/quizzes-api";
import type { QuizPreview } from "@/types/quiz";
import { useAuth } from "@/context/auth-context";
import { ApiClientError } from "@/lib/api";

export default function QuizPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const quizId = params.quizId as string;
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [preview, setPreview] = useState<QuizPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== "STUDENT") {
      router.push(`/login?redirect=/courses/${slug}/quizzes/${quizId}`);
      return;
    }
    void (async () => {
      try {
        const res = await fetchQuizPreview(quizId);
        setPreview(res.data);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Failed to load quiz");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [authLoading, isAuthenticated, user?.role, router, slug, quizId]);

  async function handleStart() {
    setIsStarting(true);
    try {
      const res = await startQuiz(quizId);
      router.push(`/courses/${slug}/quizzes/${quizId}/attempt/${res.data.attempt.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not start quiz");
      setIsStarting(false);
    }
  }

  return (
    <PageBackground variant="default">
      <AuthNavbar />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {isLoading || authLoading ? (
          <QuizSkeleton />
        ) : error || !preview ? (
          <div className="text-center">
            <h1 className="font-serif text-2xl font-bold">Quiz unavailable</h1>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Link href={`/courses/${slug}/learn`} className="mt-6 inline-block">
              <Button variant="secondary">Back to course</Button>
            </Link>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Link href={`/courses/${slug}/learn`} className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to learning
            </Link>
            <div className="mt-6 rounded-2xl border border-border bg-card p-8 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">Assessment</p>
              <h1 className="mt-2 font-serif text-3xl font-bold">{preview.quiz.title}</h1>
              {preview.quiz.description && (
                <p className="mt-4 text-muted-foreground">{preview.quiz.description}</p>
              )}
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li>{preview.quiz.questionCount} multiple-choice questions</li>
                {preview.quiz.timeLimit && (
                  <li>{Math.floor(preview.quiz.timeLimit / 60)} minute time limit</li>
                )}
                <li>Passing score: {preview.quiz.passingScore}%</li>
                {preview.bestScore != null && <li>Your best score: {preview.bestScore}%</li>}
                {preview.hasPassed && (
                  <li className="font-semibold text-green-600">You have passed this quiz</li>
                )}
              </ul>
              <Button
                className="mt-8 w-full"
                size="lg"
                variant="gold"
                onClick={() => void handleStart()}
                disabled={isStarting}
              >
                {isStarting ? "Starting…" : preview.hasPassed ? "Retake quiz" : "Start quiz"}
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </PageBackground>
  );
}
