"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { fetchMyBatch } from "@/lib/batches-api";
import type { Batch } from "@/types/institute";
export default function StudentBatchPage() {
  const [batch, setBatch] = useState<Batch | null | undefined>(undefined);

  useEffect(() => {
    void fetchMyBatch().then((res) => setBatch(res.data));
  }, []);

  return (
    <DashboardShell
      title="My Batch"
      description="Your assigned batch, teacher, and class schedule."
      badge="Student Portal"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1">
          {batch === undefined ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading batch" />
            </div>
          ) : batch === null ? (
            <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              You are not assigned to a batch yet.
            </p>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8">
              <h2 className="font-serif text-2xl font-bold">{batch.name}</h2>
              {batch.description && (
                <p className="mt-2 text-muted-foreground">{batch.description}</p>
              )}
              {(batch.assignedCourses?.length ?? 0) > 0 || batch.course ? (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground">Assigned courses</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {(batch.assignedCourses?.length
                      ? batch.assignedCourses
                      : batch.course
                        ? [batch.course]
                        : []
                    ).map((c) => (
                      <li key={c.id}>
                        <a href={`/courses/${c.slug}`} className="text-green-700 hover:underline dark:text-green-400">
                          {c.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <dl className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Teacher</dt>
                  <dd className="font-medium">{batch.teacher?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Timing</dt>
                  <dd className="font-medium">{batch.timing ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Days</dt>
                  <dd className="font-medium">{batch.daysOfWeek ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium">{batch.status}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
