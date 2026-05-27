"use client";

import { motion } from "framer-motion";

interface ProgressIndicatorProps {
  current: number;
  total: number;
  answered: Set<number>;
  onGoTo?: (index: number) => void;
}

export function ProgressIndicator({ current, total, answered, onGoTo }: ProgressIndicatorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
      {Array.from({ length: total }).map((_, i) => {
        const isCurrent = i === current;
        const isAnswered = answered.has(i);

        return (
          <motion.button
            key={i}
            type="button"
            onClick={() => onGoTo?.(i)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
              isCurrent
                ? "gradient-brand text-white shadow-sm"
                : isAnswered
                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {i + 1}
          </motion.button>
        );
      })}
    </div>
  );
}

export function QuizSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-48 rounded-lg bg-muted" />
      <div className="h-64 rounded-2xl bg-muted" />
      <div className="flex gap-3">
        <div className="h-10 w-24 rounded-xl bg-muted" />
        <div className="h-10 w-24 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
