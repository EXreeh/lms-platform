"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { CourseCard } from "@/components/courses/course-card";
import { EmptyState } from "@/components/courses/empty-state";
import { Button } from "@/components/ui/button";
import { publishCourse } from "@/lib/courses-api";
import { isDemoCourseId } from "@/lib/demo-dashboard";
import type { Course } from "@/types/course";
import { ApiClientError } from "@/lib/api";

interface ModerationSectionProps {
  courses: Course[];
  demoMode?: boolean;
  onPublished?: () => void;
}

export function ModerationSection({ courses, demoMode, onPublished }: ModerationSectionProps) {
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish(course: Course) {
    if (demoMode || isDemoCourseId(course.id)) return;
    setPublishingId(course.id);
    setError(null);
    try {
      await publishCourse(course.id, true);
      onPublished?.();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to publish course");
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <section>
      <h2 className="mb-4 font-serif text-lg font-bold text-foreground">
        Course moderation (drafts awaiting review)
      </h2>
      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {courses.length === 0 ? (
        <EmptyState title="All clear" description="No draft courses pending moderation." icon="✓" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="space-y-3"
            >
              <CourseCard
                course={course}
                href={
                  demoMode || isDemoCourseId(course.id)
                    ? `/courses/${course.slug}`
                    : `/dashboard/teacher/courses/${course.id}/edit`
                }
                showStatus
              />
              <div className="flex flex-wrap gap-2 px-1">
                {!demoMode && !isDemoCourseId(course.id) && (
                  <>
                    <Button
                      size="sm"
                      variant="gold"
                      disabled={publishingId === course.id}
                      onClick={() => void handlePublish(course)}
                    >
                      {publishingId === course.id ? "Publishing…" : "Approve & publish"}
                    </Button>
                    <Link href={`/dashboard/teacher/courses/${course.id}/edit`}>
                      <Button size="sm" variant="secondary">
                        Review
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
