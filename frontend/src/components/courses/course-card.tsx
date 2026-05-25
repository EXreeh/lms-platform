"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Course } from "@/types/course";
import { formatPrice } from "@/types/course";

interface CourseCardProps {
  course: Course;
  href?: string;
  showStatus?: boolean;
}

const levelColors: Record<string, string> = {
  BEGINNER: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  INTERMEDIATE: "bg-gold-100 text-gold-800 dark:bg-gold-900/30 dark:text-gold-300",
  ADVANCED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export function CourseCard({ course, href, showStatus }: CourseCardProps) {
  const link = href ?? `/courses/${course.slug}`;

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg hover:shadow-green-900/5"
    >
      <Link href={link} className="block">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width:768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center gradient-brand opacity-90">
              <span className="font-serif text-2xl font-bold text-white/90">
                {course.title.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${levelColors[course.level]}`}
            >
              {course.level}
            </span>
            {showStatus && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  course.published
                    ? "bg-green-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {course.published ? "Live" : "Draft"}
              </span>
            )}
          </div>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-green-700 dark:text-gold-400">
            {course.category}
          </p>
          <h3 className="mt-1 line-clamp-2 font-semibold text-foreground group-hover:text-green-700 dark:group-hover:text-gold-400">
            {course.title}
          </h3>
          {course.teacher && (
            <p className="mt-2 text-sm text-muted-foreground">{course.teacher.name}</p>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="font-bold text-foreground">{formatPrice(course.price)}</span>
            <span className="text-xs text-muted-foreground">
              {course.lessonCount ?? 0} lessons
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
