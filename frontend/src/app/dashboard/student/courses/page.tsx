"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { CourseCard } from "@/components/courses/course-card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { fetchMyAssignedCourses } from "@/lib/course-access-api";
import type { AssignedCourse } from "@/lib/course-access-api";
import { formatApiError } from "@/lib/format-api-error";

export default function StudentMyCoursesPage() {
  const [courses, setCourses] = useState<AssignedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchMyAssignedCourses();
        setCourses(res.data);
      } catch (err) {
        setError(formatApiError(err, "Failed to load your courses"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardShell
      title="My Courses"
      description="Courses assigned to you by your institute admin or batch."
      badge="Student Portal"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading courses" />
            </div>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-muted-foreground">
                No courses assigned yet. Contact your institute admin.
              </p>
              <Link href="/dashboard/student/messages" className="mt-4 inline-block">
                <Button variant="secondary">Message admin</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((item) => (
                <div key={item.course.id} className="space-y-2">
                  <CourseCard
                    course={item.course}
                    hidePrice
                    accessLabel={item.accessLabel}
                  />
                  <div className="flex items-center justify-between px-1 text-xs">
                    <span
                      className={
                        item.accessActive
                          ? "text-green-700 dark:text-green-400"
                          : "text-amber-700 dark:text-amber-400"
                      }
                    >
                      {item.accessLabel}
                    </span>
                    {item.accessActive ? (
                      <Link
                        href={`/courses/${item.course.slug}/learn`}
                        className="font-medium text-green-700 hover:underline dark:text-green-400"
                      >
                        Open
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard/student/fees"
                        className="font-medium text-muted-foreground hover:underline"
                      >
                        View fees
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
