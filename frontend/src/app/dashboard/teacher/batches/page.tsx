"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { BatchStatusBadge } from "@/components/institute/batch-status-badge";
import { EmptyState } from "@/components/courses/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { fetchTeacherBatches } from "@/lib/batches-api";
import type { Batch } from "@/types/institute";
import { formatApiError } from "@/lib/format-api-error";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TeacherBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchTeacherBatches();
        setBatches(res.data);
      } catch (err) {
        setError(formatApiError(err, "Failed to load batches"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardShell
      title="My Batches"
      description="Batches assigned to you and their students. Read-only — contact admin to change assignments."
      badge="Teacher Portal"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1 space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading batches" />
            </div>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : batches.length === 0 ? (
            <EmptyState
              title="No batches assigned yet"
              description="Your institute admin will assign batches to you when ready."
              icon="📅"
            />
          ) : (
            batches.map((b) => (
              <div key={b.id} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl font-bold">{b.name}</h2>
                    {b.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
                    )}
                  </div>
                  <BatchStatusBadge status={b.status} />
                </div>

                <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Course</dt>
                    <dd className="font-medium">
                      {b.course?.title ?? b.assignedCourses?.[0]?.title ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Timing</dt>
                    <dd className="font-medium">{b.timing ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Days</dt>
                    <dd className="font-medium">{b.daysOfWeek ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Starts</dt>
                    <dd className="font-medium">{formatDate(b.startDate)}</dd>
                  </div>
                </dl>

                <div className="mt-6">
                  <h3 className="text-sm font-medium">
                    Students ({b.students.length})
                  </h3>
                  {b.students.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No students in this batch.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-border text-sm md:hidden">
                      {b.students.map((s) => (
                        <li key={s.id} className="py-3">
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                          {s.accessStatus && (
                            <p className="mt-1 text-xs text-muted-foreground">{s.accessStatus}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {b.students.length > 0 && (
                    <div className="-mx-1 mt-3 hidden overflow-x-auto md:block">
                      <table className="w-full min-w-[480px] text-left text-sm">
                        <thead className="text-muted-foreground">
                          <tr>
                            <th className="p-2 font-medium">Name</th>
                            <th className="p-2 font-medium">Email</th>
                            <th className="p-2 font-medium">Access</th>
                          </tr>
                        </thead>
                        <tbody>
                          {b.students.map((s) => (
                            <tr key={s.id} className="border-t border-border/60">
                              <td className="p-2 font-medium">{s.name}</td>
                              <td className="p-2 text-muted-foreground">{s.email}</td>
                              <td className="p-2 text-xs text-muted-foreground">
                                {s.accessStatus ?? "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <Link href="/dashboard/teacher/messages">
                  <Button className="mt-4" variant="secondary">
                    Message students
                  </Button>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
