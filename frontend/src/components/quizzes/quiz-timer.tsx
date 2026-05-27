"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface QuizTimerProps {
  startedAt: string;
  timeLimit: number | null;
  onExpire?: () => void;
}

export function QuizTimer({ startedAt, timeLimit, onExpire }: QuizTimerProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
  }, [startedAt, timeLimit]);

  useEffect(() => {
    if (!timeLimit) {
      setRemaining(null);
      return;
    }

    function tick() {
      const limit = timeLimit as number;
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      const left = Math.max(0, limit - elapsed);
      setRemaining(left);
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt, timeLimit, onExpire]);

  if (remaining === null) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const urgent = remaining <= 60;

  return (
    <motion.div
      animate={urgent ? { scale: [1, 1.04, 1] } : {}}
      transition={urgent ? { repeat: Infinity, duration: 1 } : {}}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-sm font-semibold ${
        urgent
          ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
          : "bg-muted text-foreground"
      }`}
    >
      <span aria-hidden>⏱</span>
      {minutes}:{seconds.toString().padStart(2, "0")}
    </motion.div>
  );
}
