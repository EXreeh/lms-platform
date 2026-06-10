"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { RecordingPlayer } from "@/components/live-classes/recording-player";
import { Spinner } from "@/components/ui/spinner";
import { fetchTeacherBatches } from "@/lib/batches-api";
import { fetchTeacherBatchRecordings } from "@/lib/live-classes-api";
import type { LiveClassRecording } from "@/types/institute";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

export default function TeacherRecordingsPage() {
  const { error: toastError } = useToast();
  const [recordings, setRecordings] = useState<LiveClassRecording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const batches = await fetchTeacherBatches();
        const all: LiveClassRecording[] = [];
        for (const batch of batches.data) {
          const res = await fetchTeacherBatchRecordings(batch.id);
          all.push(...res.data);
        }
        setRecordings(all);
      } catch (err) {
        toastError(formatApiError(err, "Failed to load"));
      } finally {
        setLoading(false);
      }
    })();
  }, [toastError]);

  return (
    <DashboardShell title="Batch Recordings" description="Recordings for your assigned batches only." badge="Teacher">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1 space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload from{" "}
            <Link href="/dashboard/teacher/live-classes" className="text-primary hover:underline">My Live Classes</Link>.
          </p>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner label="Loading" /></div>
          ) : recordings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <p className="text-4xl">🎬</p>
              <p className="mt-3 font-medium">No recordings uploaded yet</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {recordings.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-sm text-muted-foreground">{r.batchName} · {r.liveClassTitle}</p>
                  <RecordingPlayer recording={r} className="mt-3 max-h-56 w-full rounded-xl bg-black object-contain" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
