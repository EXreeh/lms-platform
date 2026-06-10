"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { RecordingPlayer } from "@/components/live-classes/recording-player";
import { Spinner } from "@/components/ui/spinner";
import { fetchMyBatch } from "@/lib/batches-api";
import { fetchBatchRecordings } from "@/lib/live-classes-api";
import type { LiveClassRecording } from "@/types/institute";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

export default function StudentRecordingsPage() {
  const { error: toastError } = useToast();
  const [recordings, setRecordings] = useState<LiveClassRecording[]>([]);
  const [batchName, setBatchName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const batchRes = await fetchMyBatch();
        if (!batchRes.data) {
          setLoading(false);
          return;
        }
        setBatchName(batchRes.data.name);
        const res = await fetchBatchRecordings(batchRes.data.id);
        setRecordings(res.data);
      } catch (err) {
        toastError(formatApiError(err, "Failed to load"));
      } finally {
        setLoading(false);
      }
    })();
  }, [toastError]);

  if (!loading && !batchName) {
    return (
      <DashboardShell title="Recordings" description="Your batch recordings." badge="Student">
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
    <DashboardShell title="Recordings" description={`${batchName} — your batch only`} badge="Student">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1">
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
                  <p className="text-sm text-muted-foreground">{r.liveClassTitle}</p>
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
