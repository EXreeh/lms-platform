"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Quiz } from "@/types/quiz";

interface QuizCardProps {
  quiz: Quiz;
  href: string;
  subtitle?: string;
  showStats?: boolean;
}

export function QuizCard({ quiz, href, subtitle, showStats }: QuizCardProps) {
  return (
    <motion.article
      whileHover={{ y: -3 }}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <Link href={href} className="block p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-600 dark:text-gold-400">
              Quiz · MCQ
            </p>
            <h3 className="mt-1 font-semibold text-foreground">{quiz.title}</h3>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            {quiz.description && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{quiz.description}</p>
            )}
          </div>
          {quiz.passed !== undefined && (
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                quiz.passed
                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                  : quiz.bestScore != null
                    ? "bg-gold-100 text-gold-800 dark:bg-gold-900/40 dark:text-gold-300"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {quiz.passed ? "Passed" : quiz.bestScore != null ? `${quiz.bestScore}%` : "Not taken"}
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>{quiz.questionCount} questions</span>
          {quiz.timeLimit && <span>{Math.floor(quiz.timeLimit / 60)} min limit</span>}
          <span>Pass: {quiz.passingScore}%</span>
          {showStats && quiz.attemptCount !== undefined && (
            <span>{quiz.attemptCount} attempts</span>
          )}
        </div>
      </Link>
    </motion.article>
  );
}
