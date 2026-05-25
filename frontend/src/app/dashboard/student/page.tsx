"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { CourseSection } from "@/components/dashboard/course-section";
import { DemoBanner } from "@/components/dashboard/demo-banner";
import { CourseCard } from "@/components/courses/course-card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { fetchStudentDashboard } from "@/lib/dashboard-api";
import { getDemoStudentDashboard } from "@/lib/demo-dashboard";
import type { StudentDashboardData } from "@/types/dashboard";

export default function StudentDashboardPage() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchStudentDashboard();
        if (res.data.isEmpty) {
          setData(getDemoStudentDashboard());
          setShowDemo(true);
        } else {
          setData(res.data);
        }
      } catch {
        setData(getDemoStudentDashboard());
        setShowDemo(true);
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
            <div className="flex justify-center py-20">
              <Spinner size="lg" label="Loading dashboard" />
            </div>
          ) : data ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {showDemo && <DemoBanner />}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Enrolled" value={data.stats.enrolled} icon="📖" accent="green" />
                <StatCard label="In progress" value={data.stats.inProgress} icon="▶" accent="gold" />
                <StatCard label="Completed" value={data.stats.completed} icon="✓" />
                <StatCard
                  label="Hours learned"
                  value={data.stats.hoursLearned}
                  subtext="Estimated"
                  icon="⏱"
                  accent="green"
                />
              </div>

              {data.continueLearning && (
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  className="overflow-hidden rounded-2xl border border-border gradient-border"
                >
                  <div className="bg-card p-6 sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gold-600 dark:text-gold-400">
                      Continue learning
                    </p>
                    <h2 className="mt-2 font-serif text-xl font-bold text-foreground">
                      {data.continueLearning.course.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Next: {data.continueLearning.lessonTitle}
                    </p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full gradient-brand"
                        initial={{ width: 0 }}
                        animate={{ width: `${data.continueLearning.progress}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {Math.round(data.continueLearning.progress)}% complete
                    </p>
                    <Link
                      href={`/courses/${data.continueLearning.slug}`}
                      className="mt-4 inline-block"
                    >
                      <Button variant="gold">Resume course</Button>
                    </Link>
                  </div>
                </motion.div>
              )}

              <section>
                <h2 className="mb-4 font-serif text-lg font-bold">My courses</h2>
                {data.enrolledCourses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                    <p className="text-muted-foreground">You haven&apos;t enrolled yet.</p>
                    <Link href="/courses" className="mt-4 inline-block">
                      <Button variant="gold">Browse courses</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {data.enrolledCourses.map(({ course, progress }) => (
                      <div key={course.id} className="relative">
                        <CourseCard course={course} href={`/courses/${course.slug}`} />
                        <div className="absolute bottom-16 left-5 right-5">
                          <div className="h-1.5 overflow-hidden rounded-full bg-black/20">
                            <div
                              className="h-full bg-gold-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
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
