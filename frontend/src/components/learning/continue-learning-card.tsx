"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "./progress-bar";

interface ContinueLearningCardProps {
  courseTitle: string;
  lessonTitle: string;
  moduleTitle?: string;
  progress: number;
  href: string;
}

export function ContinueLearningCard({
  courseTitle,
  lessonTitle,
  moduleTitle,
  progress,
  href,
}: ContinueLearningCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      className="overflow-hidden rounded-2xl border border-border gradient-border"
    >
      <div className="bg-card p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-600 dark:text-gold-400">
          Continue learning
        </p>
        <h2 className="mt-2 font-serif text-xl font-bold text-foreground">{courseTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {moduleTitle ? `${moduleTitle} · ` : ""}
          Next: {lessonTitle}
        </p>
        <div className="mt-4">
          <ProgressBar value={progress} showLabel size="md" />
        </div>
        <Link href={href} className="mt-5 inline-block">
          <Button variant="gold">Resume lesson</Button>
        </Link>
      </div>
    </motion.div>
  );
}
