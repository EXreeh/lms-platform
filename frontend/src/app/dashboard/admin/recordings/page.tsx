"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { RecordingPlayer } from "@/components/live-classes/recording-player";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { deleteRecording, fetchRecordings } from "@/lib/live-classes-api";
import type { LiveClassRecording } from "@/types/institute";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

export default function AdminRecordingsPage() {
  const { success, error: toastError } = useToast();
  const [recordings, setRecordings] = useState<LiveClassRecording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchRecordings();
        setRecordings(res.data);
      } catch (err) {
        toastError(formatApiError(err, "Failed to load recordings"));
      } finally {
        setLoading(false);
      }
    })();
  }, [toastError]);

  async function handleDelete(id: string) {
    if (!confirm("Remove this recording?")) return;
    try {
      await deleteRecording(id);
      success("Recording removed");
      setRecordings((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toastError(formatApiError(err, "Delete failed"));
    }
  }

  return (
    <DashboardShell title="Recordings" description="All batch live class recordings." badge="Administrator">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload new recordings from the{" "}
            <Link href="/dashboard/admin/live-classes" className="text-primary hover:underline">
              Live Classes
            </Link>{" "}
            page.
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
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{r.title}</p>
                      <p className="text-sm text-muted-foreground">{r.batchName} · {r.liveClassTitle} · {r.teacherName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.uploadedAt).toLocaleString()}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => void handleDelete(r.id)}>Archive</Button>
                  </div>
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
