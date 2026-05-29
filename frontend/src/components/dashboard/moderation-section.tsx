"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { CourseCard } from "@/components/courses/course-card";
import { EmptyState } from "@/components/courses/empty-state";
import { Button } from "@/components/ui/button";
import { approveCourse, rejectCourse } from "@/lib/admin-api";
import { isDemoCourseId } from "@/lib/demo-dashboard";
import type { Course } from "@/types/course";
import { ApiClientError } from "@/lib/api";

interface ModerationSectionProps {
  courses: Course[];
  onUpdated?: () => void;
}

export function ModerationSection({ courses, onUpdated }: ModerationSectionProps) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove(course: Course) {
    if (isDemoCourseId(course.id)) return;
    setActionId(course.id);
    setError(null);
    try {
      await approveCourse(course.id);
      onUpdated?.();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to approve course");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(course: Course) {
    if (isDemoCourseId(course.id)) return;
    if (!confirm(`Reject "${course.title}"?`)) return;
    setActionId(course.id);
    setError(null);
    try {
      await rejectCourse(course.id);
      onUpdated?.();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to reject course");
    } finally {
      setActionId(null);
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-serif text-lg font-bold text-foreground">
          Courses awaiting review
        </h2>
        <Link href="/dashboard/admin/review" className="text-sm font-medium text-green-700 dark:text-gold-400">
          Open review queue →
        </Link>
      </div>
      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {courses.length === 0 ? (
        <EmptyState title="All clear" description="No courses pending review." icon="✓" />
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
                href={`/dashboard/teacher/courses/${course.id}/edit`}
                showStatus
              />
              <div className="flex flex-wrap gap-2 px-1">
                {!isDemoCourseId(course.id) && (
                  <>
                    <Button
                      size="sm"
                      variant="gold"
                      disabled={actionId === course.id}
                      onClick={() => void handleApprove(course)}
                    >
                      {actionId === course.id ? "Processing…" : "Approve & publish"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actionId === course.id}
                      onClick={() => void handleReject(course)}
                    >
                      Reject
                    </Button>
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
