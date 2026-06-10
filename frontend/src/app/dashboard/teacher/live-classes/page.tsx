"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { LiveClassFilters } from "@/components/live-classes/live-class-filters";
import { RecordingPlayer } from "@/components/live-classes/recording-player";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { fetchTeacherBatches } from "@/lib/batches-api";
import {
  fetchLiveClassStats,
  fetchTeacherLiveClasses,
  scheduleLiveClass,
  uploadLiveClassRecording,
} from "@/lib/live-classes-api";
import type { LiveClass, LiveClassStats } from "@/types/institute";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

export default function TeacherLiveClassesPage() {
  const { success, error: toastError } = useToast();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [stats, setStats] = useState<LiveClassStats | null>(null);
  const [batches, setBatches] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchId, setBatchId] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ batchId: "", title: "", description: "", scheduledAt: "", durationMinutes: "60" });
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({ title: "", description: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

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

  async function handleSchedule() {
    try {
      await scheduleLiveClass(
        {
          batchId: form.batchId,
          title: form.title,
          description: form.description || undefined,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          durationMinutes: Number(form.durationMinutes) || 60,
        },
        "TEACHER",
      );
      success("Live class scheduled for your batch");
      setShowForm(false);
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to schedule"));
    }
  }

  async function handleUpload(liveClassId: string) {
    if (!uploadFile || !uploadForm.title.trim()) {
      toastError("Title and video file required");
      return;
    }
    try {
      await uploadLiveClassRecording(liveClassId, uploadFile, { title: uploadForm.title.trim(), description: uploadForm.description || undefined }, "TEACHER");
      success("Recording uploaded for your batch");
      setUploadTarget(null);
      setUploadFile(null);
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Upload failed"));
    }
  }

  if (batches.length === 0 && !loading) {
    return (
      <DashboardShell title="My Live Classes" description="Batch-specific schedules and recordings." badge="Teacher">
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
    <DashboardShell title="My Live Classes" description="Schedule and upload recordings for your assigned batches only." badge="Teacher">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1 space-y-6">
          {stats ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Today's classes" value={stats.today} />
              <StatCard label="Upcoming batch classes" value={stats.upcoming} />
              <StatCard label="Uploaded recordings" value={stats.totalRecordings} />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button variant="gold" onClick={() => setShowForm((v) => !v)}>
              Schedule live class
            </Button>
          </div>

          {showForm ? (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Your batch" options={[{ value: "", label: "Select batch" }, ...batches]} value={form.batchId} onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))} />
                <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                <Input label="Date & time" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
                <Input label="Duration (minutes)" type="number" value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))} />
              </div>
              <Button className="mt-4" onClick={() => void handleSchedule()}>Save schedule</Button>
            </div>
          ) : null}

          <LiveClassFilters search={search} onSearchChange={setSearch} batchId={batchId} onBatchChange={setBatchId} status={status} onStatusChange={setStatus} batches={batches} />

          {loading ? (
            <div className="flex justify-center py-12"><Spinner label="Loading" /></div>
          ) : classes.length === 0 ? (
            <EmptyState message="No live classes scheduled yet for your batches" />
          ) : (
            <ul className="space-y-4">
              {classes.map((c) => (
                <li key={c.id} className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-sm text-muted-foreground">{c.batchName} · {new Date(c.scheduledAt).toLocaleString()} · {c.status}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setUploadTarget(uploadTarget === c.id ? null : c.id)}>Upload recording</Button>
                  </div>
                  {uploadTarget === c.id ? (
                    <div className="mt-3 space-y-2 rounded-xl border border-border p-4">
                      <Input label="Recording title" value={uploadForm.title} onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))} />
                      <input type="file" accept="video/*" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
                      <Button size="sm" onClick={() => void handleUpload(c.id)}>Upload</Button>
                    </div>
                  ) : null}
                  {c.recordings?.map((r) => (
                    <div key={r.id} className="mt-3 rounded-xl border border-border p-3">
                      <p className="text-sm font-medium">{r.title}</p>
                      <RecordingPlayer recording={{ title: r.title, videoUrl: r.videoUrl, videoStorageKey: null, videoStorageProvider: "r2", videoMimeType: "video/mp4", videoFileName: r.title }} className="mt-2 max-h-36 w-full rounded-lg bg-black object-contain" />
                    </div>
                  ))}
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
