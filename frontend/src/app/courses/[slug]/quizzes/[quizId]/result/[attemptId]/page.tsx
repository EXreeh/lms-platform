"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import { PageBackground } from "@/components/layout/page-background";
import { ResultSummary } from "@/components/quizzes/result-summary";
import { QuestionCard } from "@/components/quizzes/question-card";
import { QuizSkeleton } from "@/components/quizzes/progress-indicator";
import { Button } from "@/components/ui/button";
import { fetchQuizResult } from "@/lib/quizzes-api";
import type { QuizResult } from "@/types/quiz";
import { useAuth } from "@/context/auth-context";
import { ApiClientError } from "@/lib/api";

export default function QuizResultPage() {
  const params = useParams();
  const slug = params.slug as string;
  const quizId = params.quizId as string;
  const attemptId = params.attemptId as string;
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [result, setResult] = useState<QuizResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/courses/${slug}/quizzes/${quizId}/result/${attemptId}`);
      setIsLoading(false);
      return;
    }
    if (user?.role !== "STUDENT") {
      router.push("/dashboard/student");
      setIsLoading(false);
      return;
    }
    void (async () => {
      try {
        const res = await fetchQuizResult(attemptId);
        setResult(res.data);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Failed to load results");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [authLoading, isAuthenticated, user?.role, router, slug, quizId, attemptId]);

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

  if (error || !result) {
    return (
      <PageBackground variant="default">
        <AuthNavbar />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <p>{error ?? "Results not found"}</p>
        </main>
      </PageBackground>
    );
  }

  const reviewItems = result.attempt.questionAttempts ?? [];

  return (
    <PageBackground variant="default">
      <AuthNavbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <ResultSummary
          score={result.attempt.score}
          passed={result.attempt.passed}
          passingScore={result.passingScore}
          correctCount={result.correctCount}
          totalQuestions={result.totalQuestions}
          quizTitle={result.quiz.title}
          retryHref={`/courses/${slug}/quizzes/${quizId}`}
          continueHref={`/courses/${slug}/learn`}
        />

        <div className="mt-10 text-center">
          <Button variant="ghost" onClick={() => setShowReview((v) => !v)}>
            {showReview ? "Hide review" : "Review answers"}
          </Button>
        </div>

        {showReview && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
          >
            {reviewItems.map((qa, i) => (
              <QuestionCard
                key={qa.id}
                question={{
                  id: qa.questionId,
                  quizId: result.quiz.id,
                  question: qa.question ?? "",
                  type: "MCQ",
                  options: qa.options ?? [],
                  correctAnswer: qa.correctAnswer,
                  points: qa.points ?? 1,
                  order: i,
                  createdAt: "",
                }}
                index={i}
                total={reviewItems.length}
                selectedAnswer={qa.selectedAnswer}
                onSelect={() => {}}
                reviewMode
                showCorrect
              />
            ))}
          </motion.div>
        )}
      </main>
    </PageBackground>
  );
}
