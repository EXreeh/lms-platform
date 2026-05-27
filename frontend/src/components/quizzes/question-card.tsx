"use client";

import { motion } from "framer-motion";
import type { Question } from "@/types/quiz";

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  reviewMode?: boolean;
  showCorrect?: boolean;
}

export function QuestionCard({
  question,
  index,
  total,
  selectedAnswer,
  onSelect,
  reviewMode,
  showCorrect,
}: QuestionCardProps) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <p className="text-xs font-medium text-muted-foreground">
        Question {index + 1} of {total} · {question.points} pt{question.points !== 1 ? "s" : ""}
      </p>
      <h2 className="mt-3 font-serif text-xl font-bold text-foreground">{question.question}</h2>

      <ul className="mt-6 space-y-3">
        {question.options.map((option) => {
          const selected = selectedAnswer === option;
          const isCorrect = showCorrect && question.correctAnswer === option;
          const isWrong = showCorrect && selected && !isCorrect;

          return (
            <li key={option}>
              <button
                type="button"
                disabled={reviewMode}
                onClick={() => onSelect(option)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                  isCorrect
                    ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                    : isWrong
                      ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                      : selected
                        ? "border-gold-500 bg-gold-50 dark:bg-gold-950/20"
                        : "border-border hover:border-green-300 hover:bg-muted/50"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                    selected || isCorrect ? "border-transparent bg-green-600 text-white" : "border-border"
                  }`}
                >
                  {isCorrect ? "✓" : isWrong ? "✗" : selected ? "●" : ""}
                </span>
                <span>{option}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
