"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CourseCard } from "@/components/courses/course-card";
import { EmptyState } from "@/components/courses/empty-state";
import { Button } from "@/components/ui/button";
import type { Course } from "@/types/course";

interface CourseSectionProps {
  title: string;
  courses: Course[];
  editHref?: (course: Course) => string;
  browseHref?: (course: Course) => string;
  showStatus?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  createHref?: string;
  hidePrice?: boolean;
}

export function CourseSection({
  title,
  courses,
  editHref,
  browseHref,
  showStatus,
  emptyTitle = "No courses",
  emptyDescription = "Nothing here yet.",
  createHref,
  hidePrice,
}: CourseSectionProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold text-foreground">{title}</h2>
        {createHref ? (
          <Link href={createHref}>
            <Button size="sm" variant="ghost">
              + Add
            </Button>
          </Link>
        ) : null}
      </div>
      {courses.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} icon="📚" />
      ) : (
        <motion.div layout className="grid gap-5 sm:grid-cols-2">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <CourseCard
                course={course}
                href={
                  editHref?.(course) ?? browseHref?.(course) ?? `/courses/${course.slug}`
                }
                showStatus={showStatus}
                hidePrice={hidePrice}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
