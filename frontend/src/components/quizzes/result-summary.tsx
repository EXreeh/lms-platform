"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/learning/progress-bar";

interface ResultSummaryProps {
  score: number;
  passed: boolean;
  passingScore: number;
  correctCount: number;
  totalQuestions: number;
  quizTitle: string;
  retryHref?: string;
  continueHref?: string;
}

export function ResultSummary({
  score,
  passed,
  passingScore,
  correctCount,
  totalQuestions,
  quizTitle,
  retryHref,
  continueHref,
}: ResultSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-lg"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl ${
          passed
            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
        }`}
      >
        {passed ? "✓" : "✗"}
      </motion.div>

      <h1 className="mt-6 font-serif text-2xl font-bold text-foreground">
        {passed ? "Congratulations!" : "Keep practicing"}
      </h1>
      <p className="mt-2 text-muted-foreground">{quizTitle}</p>

      <div className="mt-6">
        <p className="font-serif text-5xl font-bold text-foreground">{Math.round(score)}%</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {correctCount} of {totalQuestions} correct · Pass mark {passingScore}%
        </p>
      </div>

      <div className="mt-6">
        <ProgressBar value={score} showLabel={false} size="lg" />
      </div>

      <p
        className={`mt-4 text-sm font-semibold ${
          passed ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"
        }`}
      >
        {passed ? "You passed this quiz!" : "You did not meet the passing score."}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {retryHref && (
          <Link href={retryHref}>
            <Button variant="gold">Try again</Button>
          </Link>
        )}
        {continueHref && (
          <Link href={continueHref}>
            <Button variant="secondary">Continue course</Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
