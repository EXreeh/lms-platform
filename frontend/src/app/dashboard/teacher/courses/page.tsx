"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { CourseSection } from "@/components/dashboard/course-section";
import { DemoBanner } from "@/components/dashboard/demo-banner";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { fetchTeacherDashboard } from "@/lib/dashboard-api";
import { getDemoTeacherDashboard, isDemoCourseId } from "@/lib/demo-dashboard";
import type { TeacherDashboardData } from "@/types/dashboard";
import { ApiClientError } from "@/lib/api";

export default function TeacherMyCoursesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const res = await fetchTeacherDashboard();
        if (cancelled) return;
        if (res.data.isEmpty) {
          setData(getDemoTeacherDashboard());
          setShowDemo(true);
        } else {
          setData(res.data);
          setShowDemo(false);
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiClientError && err.status < 500
            ? err.message
            : "Courses could not be loaded. Please try again.",
        );
        setData(getDemoTeacherDashboard());
        setShowDemo(true);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const editHref = (c: { id: string; slug: string }) =>
    showDemo || isDemoCourseId(c.id)
      ? `/courses/${c.slug}`
      : `/dashboard/teacher/courses/${c.id}/edit`;

  return (
    <DashboardShell
      title="My Courses"
      description="Create, edit, and track the status of your CognitiaX AI curriculum."
      badge="Educator Portal"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1 space-y-8">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/dashboard/teacher/courses/new">
              <Button variant="gold">+ Create course</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" label="Loading courses" />
            </div>
          ) : data ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {showDemo && <DemoBanner />}
              {error && (
                <p className="text-sm text-amber-600 dark:text-amber-400" role="alert">
                  {error} — showing demo data.
                </p>
              )}

              <CourseSection
                title="Published courses"
                courses={data.publishedCourses}
                editHref={editHref}
                showStatus
                emptyTitle="No published courses"
                emptyDescription="Submit a course for review; an admin will publish it after approval."
                createHref="/dashboard/teacher/courses/new"
              />

              {(data.underReviewCourses?.length ?? 0) > 0 && (
                <CourseSection
                  title="Under review"
                  courses={data.underReviewCourses ?? []}
                  editHref={(c) => `/dashboard/teacher/courses/${c.id}/edit`}
                  showStatus
                  emptyTitle="No courses under review"
                  emptyDescription="Submit a draft for admin approval."
                />
              )}

              <CourseSection
                title="Draft courses"
                courses={data.draftCourses}
                editHref={editHref}
                showStatus
                emptyTitle="No drafts yet"
                emptyDescription="Start a new course and save it as a draft."
                createHref="/dashboard/teacher/courses/new"
              />
            </motion.div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
