"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { LiveClassCard } from "@/components/live-classes/live-class-card";
import { Spinner } from "@/components/ui/spinner";
import { fetchLiveClassStats, fetchStudentLiveClasses, fetchStudentUpcomingLiveClasses } from "@/lib/live-classes-api";
import { fetchMyBatch } from "@/lib/batches-api";
import type { LiveClass, LiveClassStats } from "@/types/institute";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

export default function StudentLiveClassesPage() {
  const { error: toastError } = useToast();
  const [all, setAll] = useState<LiveClass[]>([]);
  const [upcoming, setUpcoming] = useState<LiveClass[]>([]);
  const [stats, setStats] = useState<LiveClassStats | null>(null);
  const [batchName, setBatchName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [batchRes, allRes, upcomingRes, statsRes] = await Promise.all([
        fetchMyBatch(),
        fetchStudentLiveClasses(),
        fetchStudentUpcomingLiveClasses(),
        fetchLiveClassStats(),
      ]);
      setBatchName(batchRes.data?.name ?? null);
      setAll(allRes.data);
      setUpcoming(upcomingRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!loading && !batchName) {
    return (
      <DashboardShell title="Live Classes" description="Your batch Zoom sessions." badge="Student">
        <div className="flex flex-col gap-8 lg:flex-row">
          <DashboardSidebar role="STUDENT" />
          <div className="flex-1 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-4xl">👥</p>
            <p className="mt-3 font-medium">No live classes for your batch yet</p>
            <p className="mt-1 text-sm text-muted-foreground">You are not assigned to any batch yet</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todays = all.filter((c) => {
    const d = new Date(c.scheduledAt);
    return d >= today && d < tomorrow && c.status !== "CANCELLED";
  });
  const completed = all.filter((c) => c.status === "COMPLETED");

  return (
    <DashboardShell title="Live Classes" description={`Batch: ${batchName ?? "—"}`} badge="Student">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1 space-y-6">
          {stats ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Next live class" value={stats.upcoming} sub={upcoming[0] ? new Date(upcoming[0].scheduledAt).toLocaleString() : "None"} />
              <StatCard label="Today's classes" value={stats.today} />
              <StatCard label="Recordings" value={stats.totalRecordings} />
            </div>
          ) : null}

          {loading ? (
            <div className="flex justify-center py-12"><Spinner label="Loading" /></div>
          ) : (
            <>
              <LiveClassSection title="Today's live classes" empty="No classes today" items={todays} showRecordings={false} />
              <LiveClassSection title="Upcoming live classes" empty="No live classes scheduled yet" items={upcoming} showRecordings={false} />
              <LiveClassSection title="Completed classes & recordings" empty="No completed classes yet" items={completed} />
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function LiveClassSection({
  title,
  empty,
  items,
  showRecordings = true,
}: {
  title: string;
  empty: string;
  items: LiveClass[];
  showRecordings?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-serif font-bold">{title}</h2>
      <div className="mt-4 space-y-4">
        {items.length > 0 ? (
          items.map((c) => (
            <LiveClassCard
              key={c.id}
              liveClass={c}
              detailHref={`/dashboard/student/live-classes/${c.id}`}
              showRecordings={showRecordings}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
