"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ResourceList } from "@/components/resources/resource-list";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchEnrolledResources } from "@/lib/resources-api";
import { formatApiError } from "@/lib/format-api-error";
import type { Resource } from "@/types/resource";
import { useToast } from "@/context/toast-context";

export default function StudentResourcesPage() {
  const { error: toastError } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchEnrolledResources();
      setResources(res.data?.resources ?? []);
    } catch (err) {
      toastError(formatApiError(err, "Could not load your course resources."));
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  const byCourse = resources.reduce<Record<string, { title: string; slug: string; items: Resource[] }>>(
    (acc, r) => {
      const key = r.courseId;
      if (!acc[key]) {
        acc[key] = {
          title: r.course?.title ?? "Course",
          slug: r.course?.slug ?? "",
          items: [],
        };
      }
      acc[key].items.push(r);
      return acc;
    },
    {},
  );

  return (
    <DashboardShell
      title="My Resources"
      description="PDFs, links, notes, and assignments from your enrolled courses on CognitiaX AI."
      badge="Student Portal"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : resources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-4xl">📎</p>
              <h2 className="mt-4 font-serif text-xl font-bold">No resources yet</h2>
              <p className="mt-2 text-muted-foreground">
                Enroll in a course to access materials shared by your instructors.
              </p>
              <Link href="/courses" className="mt-6 inline-block">
                <Button variant="gold">Browse courses</Button>
              </Link>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {Object.entries(byCourse).map(([courseId, group]) => (
                <section key={courseId} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-serif text-lg font-bold">{group.title}</h2>
                    {group.slug && (
                      <Link href={`/courses/${group.slug}/learn`}>
                        <Button variant="secondary" size="sm">
                          Open course
                        </Button>
                      </Link>
                    )}
                  </div>
                  <div className="mt-4">
                    <ResourceList
                      resources={group.items}
                      emptyMessage="No resources for this course."
                    />
                  </div>
                </section>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
