"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { LiveClassFilters } from "@/components/live-classes/live-class-filters";
import { LiveClassCard } from "@/components/live-classes/live-class-card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { fetchTeacherBatches } from "@/lib/batches-api";
import { fetchLiveClassStats, fetchTeacherLiveClasses } from "@/lib/live-classes-api";
import type { LiveClass, LiveClassStats } from "@/types/institute";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

export default function TeacherLiveClassesPage() {
  const { error: toastError } = useToast();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [stats, setStats] = useState<LiveClassStats | null>(null);
  const [batches, setBatches] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchId, setBatchId] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    try {
      const [c, b, s] = await Promise.all([
        fetchTeacherLiveClasses({ batchId: batchId || undefined, status: status || undefined, search: search || undefined }),
        fetchTeacherBatches(),
        fetchLiveClassStats(),
      ]);
      setClasses(c.data);
      setBatches(b.data.map((x) => ({ value: x.id, label: x.name })));
      setStats(s.data);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [batchId, status, search, toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!loading && batches.length === 0) {
    return (
      <DashboardShell title="My Live Classes" description="Zoom sessions for your batches." badge="Teacher">
        <div className="flex flex-col gap-8 lg:flex-row">
          <DashboardSidebar role="TEACHER" />
          <div className="flex-1 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-4xl">👥</p>
            <p className="mt-3 font-medium">You are not assigned to any batch yet</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="My Live Classes" description="Schedule Zoom links for your assigned batches." badge="Teacher">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1 space-y-6">
          {stats ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Today's classes" value={stats.today} />
              <StatCard label="Upcoming" value={stats.upcoming} />
              <StatCard label="Recordings" value={stats.totalRecordings} />
            </div>
          ) : null}
          <Link href="/dashboard/teacher/live-classes/new">
            <Button variant="gold">+ Schedule live class</Button>
          </Link>
          <LiveClassFilters search={search} onSearchChange={setSearch} batchId={batchId} onBatchChange={setBatchId} status={status} onStatusChange={setStatus} batches={batches} />
          {loading ? (
            <div className="flex justify-center py-12"><Spinner label="Loading" /></div>
          ) : classes.length === 0 ? (
            <EmptyState message="No live classes scheduled yet" />
          ) : (
            <ul className="space-y-4">
              {classes.map((c) => (
                <li key={c.id}>
                  <LiveClassCard liveClass={c} detailHref={`/dashboard/teacher/live-classes/${c.id}`} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center"><p className="text-4xl">▶</p><p className="mt-3 font-medium">{message}</p></div>;
}
