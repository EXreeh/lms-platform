"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import { PageBackground } from "@/components/layout/page-background";
import { QuestionCard } from "@/components/quizzes/question-card";
import { QuizTimer } from "@/components/quizzes/quiz-timer";
import { ProgressIndicator, QuizSkeleton } from "@/components/quizzes/progress-indicator";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchQuizAttempt, submitQuizAttempt } from "@/lib/quizzes-api";
import type { ActiveQuizSession } from "@/types/quiz";
import { useAuth } from "@/context/auth-context";
import { ApiClientError } from "@/lib/api";

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const quizId = params.quizId as string;
  const attemptId = params.attemptId as string;
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [session, setSession] = useState<ActiveQuizSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = useMemo(() => session?.questions ?? [], [session?.questions]);
  const currentQuestion = questions[currentIndex];

  const answeredIndices = useMemo(() => {
    const set = new Set<number>();
    questions.forEach((q, i) => {
      if (answers[q.id]) set.add(i);
    });
    return set;
  }, [answers, questions]);

  const loadAttempt = useCallback(async () => {
    try {
      const res = await fetchQuizAttempt(attemptId);
      setSession(res.data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load attempt");
    } finally {
      setIsLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== "STUDENT") {
      router.push(`/login?redirect=/courses/${slug}/quizzes/${quizId}/attempt/${attemptId}`);
      return;
    }
    void loadAttempt();
  }, [authLoading, isAuthenticated, user?.role, router, slug, quizId, attemptId, loadAttempt]);

  async function handleSubmit() {
    if (!session) return;
    setIsSubmitting(true);
    try {
      const payload = questions
        .filter((q) => answers[q.id])
        .map((q) => ({ questionId: q.id, selectedAnswer: answers[q.id] }));
      await submitQuizAttempt(attemptId, payload);
      router.push(`/courses/${slug}/quizzes/${quizId}/result/${attemptId}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Submit failed");
      setIsSubmitting(false);
    }
  }

  function handleExpire() {
    void handleSubmit();
  }

  if (isLoading || authLoading) {
    return (
      <PageBackground variant="default">
        <AuthNavbar />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <QuizSkeleton />
        </main>
      </PageBackground>
    );
  }

  if (error || !session || !currentQuestion) {
    return (
      <PageBackground variant="default">
        <AuthNavbar />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="font-serif text-2xl font-bold">{error ?? "Quiz not found"}</h1>
          <Link href={`/courses/${slug}/quizzes/${quizId}`} className="mt-6 inline-block">
            <Button variant="secondary">Back</Button>
          </Link>
        </main>
      </PageBackground>
    );
  }

  return (
    <PageBackground variant="default">
      <AuthNavbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl font-bold">{session.quiz.title}</h1>
            <p className="text-sm text-muted-foreground">Answer all questions before submitting</p>
          </div>
          <QuizTimer
            startedAt={session.attempt.startedAt}
            timeLimit={session.timeLimit}
            onExpire={handleExpire}
          />
        </div>

        <div className="mb-6">
          <ProgressIndicator
            current={currentIndex}
            total={questions.length}
            answered={answeredIndices}
            onGoTo={setCurrentIndex}
          />
        </div>

        <AnimatePresence mode="wait">
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            index={currentIndex}
            total={questions.length}
            selectedAnswer={answers[currentQuestion.id] ?? null}
            onSelect={(answer) =>
              setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }))
            }
          />
        </AnimatePresence>

        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <Button
            variant="secondary"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => i - 1)}
          >
            Previous
          </Button>
          <div className="flex gap-3">
            {currentIndex < questions.length - 1 ? (
              <Button variant="gold" onClick={() => setCurrentIndex((i) => i + 1)}>
                Next
              </Button>
            ) : (
              <Button
                variant="gold"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting || answeredIndices.size < questions.length}
              >
                {isSubmitting ? <Spinner size="sm" /> : "Submit quiz"}
              </Button>
            )}
          </div>
        </div>

        {answeredIndices.size < questions.length && currentIndex === questions.length - 1 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Answer all {questions.length} questions to submit
          </p>
        )}
      </main>
    </PageBackground>
  );
}
