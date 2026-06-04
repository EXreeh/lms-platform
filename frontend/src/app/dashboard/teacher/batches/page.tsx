"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { fetchTeacherBatches } from "@/lib/batches-api";
import type { Batch } from "@/types/institute";

export default function TeacherBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchTeacherBatches().then((res) => {
      setBatches(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardShell
      title="My Batches"
      description="Batches assigned to you and their students."
      badge="Teacher Portal"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1 space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading batches" />
            </div>
          ) : batches.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              No batches assigned yet.
            </p>
          ) : (
            batches.map((b) => (
              <div key={b.id} className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-xl font-bold">{b.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {b.studentCount} students · {b.timing ?? "Schedule TBD"}
                  {b.daysOfWeek ? ` · ${b.daysOfWeek}` : ""}
                </p>
                <ul className="mt-4 divide-y divide-border text-sm">
                  {b.students.map((s) => (
                    <li key={s.id} className="flex justify-between py-2">
                      <span>{s.name}</span>
                      {s.accessStatus && (
                        <span className="text-xs text-muted-foreground">{s.accessStatus}</span>
                      )}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard/teacher/messages">
                  <Button className="mt-4" variant="secondary">
                    Message batch
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
