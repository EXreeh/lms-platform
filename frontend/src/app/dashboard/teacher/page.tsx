"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { CourseSection } from "@/components/dashboard/course-section";
import { DemoBanner } from "@/components/dashboard/demo-banner";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { fetchTeacherDashboard } from "@/lib/dashboard-api";
import { getDemoTeacherDashboard, isDemoCourseId } from "@/lib/demo-dashboard";
import type { TeacherDashboardData } from "@/types/dashboard";
import { ApiClientError } from "@/lib/api";

export default function TeacherDashboardPage() {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchTeacherDashboard();
        if (res.data.isEmpty) {
          setData(getDemoTeacherDashboard());
          setShowDemo(true);
        } else {
          setData(res.data);
        }
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Failed to load dashboard");
        setData(getDemoTeacherDashboard());
        setShowDemo(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardShell
      title="Teacher Studio"
      description="Create courses, track enrollments, and manage your Cognitiax AI curriculum."
      badge="Educator Portal"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1 space-y-8">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/dashboard/teacher/courses/new">
              <Button variant="gold">+ Create course</Button>
            </Link>
            <Link href="/dashboard/teacher/quizzes">
              <Button variant="secondary">Manage quizzes</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" label="Loading dashboard" />
            </div>
          ) : data ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {showDemo && <DemoBanner />}
              {error && (
                <p className="text-sm text-amber-600 dark:text-amber-400" role="alert">
                  {error} — showing demo data.
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total courses" value={data.stats.totalCourses} icon="📚" accent="green" />
                <StatCard label="Published" value={data.stats.published} icon="✓" accent="gold" />
                <StatCard label="Drafts" value={data.stats.drafts} icon="✎" />
                <StatCard
                  label="Total enrollments"
                  value={data.stats.totalEnrollments}
                  subtext={`${data.stats.totalLessons} lessons`}
                  icon="👥"
                  accent="green"
                />
              </div>

              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                  <h2 className="font-serif text-xl font-bold text-foreground">My courses</h2>
                  <CourseSection
                    title="Published courses"
                    courses={data.publishedCourses}
                    editHref={(c) =>
                      showDemo || isDemoCourseId(c.id)
                        ? `/courses/${c.slug}`
                        : `/dashboard/teacher/courses/${c.id}/edit`
                    }
                    showStatus
                    emptyTitle="No published courses"
                    emptyDescription="Publish a course to make it visible to students."
                    createHref="/dashboard/teacher/courses/new"
                  />
                  <CourseSection
                    title="Draft courses"
                    courses={data.draftCourses}
                    editHref={(c) =>
                      showDemo || isDemoCourseId(c.id)
                        ? `/courses/${c.slug}`
                        : `/dashboard/teacher/courses/${c.id}/edit`
                    }
                    showStatus
                    emptyTitle="No drafts"
                    emptyDescription="Start a new course and save as draft."
                    createHref="/dashboard/teacher/courses/new"
                  />
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="font-serif font-bold text-foreground">Recent activity</h2>
                  <div className="mt-4">
                    <ActivityFeed items={data.recentActivity} />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
