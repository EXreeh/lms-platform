"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Course } from "@/types/course";
import { ProgressBar } from "./progress-bar";
import { formatPrice } from "@/types/course";

interface CourseProgressCardProps {
  course: Course;
  progress: number;
  completed?: boolean;
  href: string;
}

export function CourseProgressCard({ course, progress, completed, href }: CourseProgressCardProps) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        className="block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-green-700 dark:text-gold-400">
                {course.category}
              </p>
              <h3 className="mt-1 line-clamp-2 font-semibold text-foreground">{course.title}</h3>
            </div>
            {completed ? (
              <span className="shrink-0 rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                Completed
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-semibold text-gold-800 dark:bg-gold-900/40 dark:text-gold-300">
                In progress
              </span>
            )}
          </div>
          <div className="mt-4">
            <ProgressBar value={progress} label="Progress" size="sm" />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{course.lessonCount ?? 0} lessons</span>
            <span>{formatPrice(course.price)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
