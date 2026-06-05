"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { CourseSection } from "@/components/dashboard/course-section";
import { ContinueLearningCard } from "@/components/learning/continue-learning-card";
import { CourseProgressCard } from "@/components/learning/course-progress-card";
import { DashboardStatsSkeleton } from "@/components/learning/learning-skeleton";
import { Button } from "@/components/ui/button";
import { fetchStudentDashboard } from "@/lib/dashboard-api";
import type { StudentDashboardData } from "@/types/dashboard";
import { formatWatchTime } from "@/lib/video-utils";
import { formatApiError } from "@/lib/format-api-error";

export default function StudentDashboardPage() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchStudentDashboard();
        setData(res.data);
      } catch (err) {
        setError(
          formatApiError(err, "Dashboard data could not be loaded. Please try again."),
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardShell
      title="Student Dashboard"
      description="Continue learning, track progress, and discover new courses."
      badge="Student Portal"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1 space-y-8">
          {isLoading ? (
            <DashboardStatsSkeleton />
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => {
                  setIsLoading(true);
                  setError(null);
                  void fetchStudentDashboard()
                    .then((res) => setData(res.data))
                    .catch((err) =>
                      setError(
                        formatApiError(err, "Dashboard data could not be loaded. Please try again."),
                      ),
                    )
                    .finally(() => setIsLoading(false));
                }}
              >
                Retry
              </Button>
            </div>
          ) : data ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Enrolled" value={data.stats.enrolled} icon="📖" accent="green" />
                <StatCard label="In progress" value={data.stats.inProgress} icon="▶" accent="gold" />
                <StatCard label="Completed" value={data.stats.completed} icon="✓" />
                <StatCard
                  label="Hours learned"
                  value={data.stats.hoursLearned}
                  subtext={
                    data.stats.lessonsCompleted !== undefined
                      ? `${data.stats.lessonsCompleted} lessons done`
                      : "Estimated"
                  }
                  icon="⏱"
                  accent="green"
                />
              </div>

              {(data.feeSummary || data.batch || data.latestMessage || data.upcomingLiveClass) && (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.feeSummary && (
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <h2 className="font-serif font-bold">Fee status</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{data.feeSummary.accessLabel}</p>
                      <p className="mt-1 text-lg font-semibold">
                        Pending ₹{data.feeSummary.pendingFee}
                      </p>
                      <Link href="/dashboard/student/fees" className="mt-3 inline-block text-sm text-green-700 dark:text-gold-400">
                        View fees →
                      </Link>
                    </div>
                  )}
                  {data.batch && (
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <h2 className="font-serif font-bold">My batch</h2>
                      <p className="mt-2 font-medium">{data.batch.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.batch.timing ?? "—"}
                        {data.batch.daysOfWeek ? ` · ${data.batch.daysOfWeek}` : ""}
                      </p>
                      <Link href="/dashboard/student/batch" className="mt-3 inline-block text-sm text-green-700 dark:text-gold-400">
                        Batch details →
                      </Link>
                    </div>
                  )}
                  {data.latestMessage && (
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <h2 className="font-serif font-bold">Latest message</h2>
                      <p className="mt-2 text-sm font-medium">{data.latestMessage.subject}</p>
                      <p className="text-xs text-muted-foreground">From {data.latestMessage.sender.name}</p>
                      <Link href="/dashboard/student/messages" className="mt-3 inline-block text-sm text-green-700 dark:text-gold-400">
                        Open inbox →
                      </Link>
                    </div>
                  )}
                  {data.upcomingLiveClass && (
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <h2 className="font-serif font-bold">Upcoming live class</h2>
                      <p className="mt-2 font-medium">{data.upcomingLiveClass.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(data.upcomingLiveClass.scheduledAt).toLocaleString()}
                      </p>
                      <Link href="/dashboard/student/live-classes" className="mt-3 inline-block text-sm text-green-700 dark:text-gold-400">
                        Live classes →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {data.stats.averageProgress !== undefined && data.stats.enrolled > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="font-serif text-lg font-bold">Progress overview</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Average completion across your enrolled courses
                  </p>
                  <div className="mt-4 flex items-end gap-4">
                    <span className="font-serif text-4xl font-bold text-green-700 dark:text-gold-400">
                      {Math.round(data.stats.averageProgress)}%
                    </span>
                    <span className="pb-1 text-sm text-muted-foreground">average progress</span>
                  </div>
                </div>
              )}

              {data.continueLearning && (
                <ContinueLearningCard
                  courseTitle={data.continueLearning.course.title}
                  lessonTitle={data.continueLearning.lessonTitle}
                  moduleTitle={data.continueLearning.moduleTitle}
                  progress={data.continueLearning.progress}
                  href={
                    data.continueLearning.learnHref ??
                    `/courses/${data.continueLearning.slug}/learn`
                  }
                />
              )}

              {data.recentlyViewed && data.recentlyViewed.length > 0 && (
                <section>
                  <h2 className="mb-4 font-serif text-lg font-bold">Recently viewed lessons</h2>
                  <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
                    {data.recentlyViewed.map((item) => (
                      <li key={item.lessonId}>
                        <Link
                          href={item.learnHref ?? `/courses/${item.courseSlug ?? ""}/learn?lesson=${item.lessonId}`}
                          className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-muted/50"
                        >
                          <div>
                            <p className="font-medium text-foreground">{item.lessonTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatWatchTime(item.watchedDuration)} watched
                            </p>
                          </div>
                          {item.completed ? (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
                              Done
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">In progress</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h2 className="mb-4 font-serif text-lg font-bold">Enrolled courses</h2>
                {data.enrolledCourses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                    <p className="text-muted-foreground">You haven&apos;t enrolled yet.</p>
                    <Link href="/courses" className="mt-4 inline-block">
                      <Button variant="gold">Browse courses</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {data.enrolledCourses.map(({ course, progress, completed }) => (
                      <CourseProgressCard
                        key={course.id}
                        course={course}
                        progress={progress}
                        completed={completed}
                        href={`/courses/${course.slug}/learn`}
                      />
                    ))}
                  </div>
                )}
              </section>

              <CourseSection
                title="Recommended for you"
                courses={data.recommendedCourses}
                browseHref={(c) => `/courses/${c.slug}`}
                emptyTitle="No recommendations"
                emptyDescription="Browse the catalog to find your next course."
              />
            </motion.div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
