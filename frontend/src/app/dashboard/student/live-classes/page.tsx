"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { RecordingPlayer } from "@/components/live-classes/recording-player";
import { Spinner } from "@/components/ui/spinner";
import { fetchLiveClassStats, fetchStudentLiveClasses } from "@/lib/live-classes-api";
import { fetchMyBatch } from "@/lib/batches-api";
import type { LiveClass, LiveClassStats } from "@/types/institute";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

export default function StudentLiveClassesPage() {
  const { error: toastError } = useToast();
  const [upcoming, setUpcoming] = useState<LiveClass[]>([]);
  const [completed, setCompleted] = useState<LiveClass[]>([]);
  const [stats, setStats] = useState<LiveClassStats | null>(null);
  const [batchName, setBatchName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [all, batchRes, s] = await Promise.all([
        fetchStudentLiveClasses(),
        fetchMyBatch(),
        fetchLiveClassStats(),
      ]);
      setBatchName(batchRes.data?.name ?? null);
      setStats(s.data);
      const now = Date.now();
      setUpcoming(all.data.filter((c) => c.status !== "CANCELLED" && new Date(c.scheduledAt).getTime() >= now - 3600000));
      setCompleted(all.data.filter((c) => c.status === "COMPLETED"));
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
      <DashboardShell title="Live Classes" description="Your batch schedule and recordings." badge="Student">
        <div className="flex flex-col gap-8 lg:flex-row">
          <DashboardSidebar role="STUDENT" />
          <div className="flex-1 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-4xl">👥</p>
            <p className="mt-3 font-medium">You are not assigned to any batch yet</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Live Classes" description={`Batch: ${batchName ?? "—"}`} badge="Student">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1 space-y-6">
          {stats ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Next live class" value={stats.upcoming > 0 ? stats.upcoming : 0} sub={upcoming[0] ? new Date(upcoming[0].scheduledAt).toLocaleString() : "None scheduled"} />
              <StatCard label="Latest recordings" value={stats.totalRecordings} />
              <StatCard label="Today's classes" value={stats.today} />
            </div>
          ) : null}

          {loading ? (
            <div className="flex justify-center py-12"><Spinner label="Loading" /></div>
          ) : (
            <>
              <Section title="Upcoming live classes" empty="No live classes scheduled yet">
                {upcoming.map((c) => (
                  <ClassCard key={c.id} liveClass={c} />
                ))}
              </Section>
              <Section title="Completed live classes" empty="No completed classes yet">
                {completed.map((c) => (
                  <ClassCard key={c.id} liveClass={c} showRecordings />
                ))}
              </Section>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.some(Boolean) && items.length > 0 && !(items.length === 1 && !items[0]);
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-serif font-bold">{title}</h2>
      <div className="mt-4 space-y-3">
        {hasItems ? children : <p className="text-sm text-muted-foreground">{empty}</p>}
      </div>
    </div>
  );
}

function ClassCard({ liveClass, showRecordings }: { liveClass: LiveClass; showRecordings?: boolean }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="font-medium">{liveClass.title}</p>
      <p className="text-sm text-muted-foreground">{new Date(liveClass.scheduledAt).toLocaleString()} · {liveClass.durationMinutes} min</p>
      {liveClass.liveUrl ? (
        <a href={liveClass.liveUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary hover:underline">
          Join live session
        </a>
      ) : null}
      {showRecordings && liveClass.recordings && liveClass.recordings.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Your batch recordings</p>
          {liveClass.recordings.map((r) => (
            <div key={r.id}>
              <p className="text-sm">{r.title}</p>
              <RecordingPlayer recording={{ title: r.title, videoUrl: r.videoUrl, videoStorageKey: null, videoStorageProvider: "r2", videoMimeType: "video/mp4", videoFileName: r.title }} className="mt-1 max-h-40 w-full rounded-lg bg-black object-contain" />
            </div>
          ))}
        </div>
      ) : showRecordings ? (
        <p className="mt-2 text-xs text-muted-foreground">No recordings uploaded yet</p>
      ) : null}
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
