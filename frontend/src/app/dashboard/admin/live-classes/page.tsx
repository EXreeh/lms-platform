"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { LiveClassFilters } from "@/components/live-classes/live-class-filters";
import { RecordingPlayer } from "@/components/live-classes/recording-player";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { fetchBatches } from "@/lib/batches-api";
import {
  cancelLiveClass,
  fetchAdminLiveClasses,
  fetchLiveClassStats,
  scheduleLiveClass,
  updateLiveClass,
  uploadLiveClassRecording,
} from "@/lib/live-classes-api";
import type { LiveClass, LiveClassStats } from "@/types/institute";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

export default function AdminLiveClassesPage() {
  const { success, error: toastError } = useToast();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [stats, setStats] = useState<LiveClassStats | null>(null);
  const [batches, setBatches] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchId, setBatchId] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    batchId: "",
    title: "",
    description: "",
    scheduledAt: "",
    durationMinutes: "60",
  });
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({ title: "", description: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, b, s] = await Promise.all([
        fetchAdminLiveClasses({
          batchId: batchId || undefined,
          status: status || undefined,
          search: search || undefined,
        }),
        fetchBatches(),
        fetchLiveClassStats(),
      ]);
      setClasses(c.data);
      setBatches(b.data.map((x) => ({ value: x.id, label: x.name })));
      setStats(s.data);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load live classes"));
    } finally {
      setLoading(false);
    }
  }, [batchId, status, search, toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => classes, [classes]);

  async function handleSchedule() {
    if (!form.batchId || !form.title || !form.scheduledAt) {
      toastError("Batch, title, and date/time are required");
      return;
    }
    try {
      await scheduleLiveClass({
        batchId: form.batchId,
        title: form.title,
        description: form.description || undefined,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: Number(form.durationMinutes) || 60,
      });
      success("Live class scheduled");
      setForm({ batchId: "", title: "", description: "", scheduledAt: "", durationMinutes: "60" });
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to schedule"));
    }
  }

  async function handleStatusChange(id: string, next: string) {
    try {
      await updateLiveClass(id, { status: next });
      success("Live class updated");
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Update failed"));
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this live class?")) return;
    try {
      await cancelLiveClass(id);
      success("Live class cancelled");
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Cancel failed"));
    }
  }

  async function handleUpload(liveClassId: string) {
    if (!uploadFile || !uploadForm.title.trim()) {
      toastError("Recording title and video file are required");
      return;
    }
    setUploading(true);
    try {
      await uploadLiveClassRecording(
        liveClassId,
        uploadFile,
        {
          title: uploadForm.title.trim(),
          description: uploadForm.description || undefined,
        },
        "ADMIN",
      );
      success("Recording uploaded");
      setUploadTarget(null);
      setUploadFile(null);
      setUploadForm({ title: "", description: "" });
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <DashboardShell
      title="Live Classes"
      description="Batch-specific live class schedules and recordings."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-6">
          {stats ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Upcoming" value={stats.upcoming} />
              <StatCard label="Completed" value={stats.completed} />
              <StatCard label="Today's classes" value={stats.today} />
              <StatCard label="Total recordings" value={stats.totalRecordings} />
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif font-bold">Schedule live class</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Select
                label="Batch"
                options={[{ value: "", label: "Select batch" }, ...batches]}
                value={form.batchId}
                onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))}
              />
              <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              <Input label="Date & time" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
              <Input label="Duration (minutes)" type="number" value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))} />
              <div className="sm:col-span-2">
                <Input label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <Button className="mt-4" variant="gold" onClick={() => void handleSchedule()}>
              Schedule
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <LiveClassFilters
              search={search}
              onSearchChange={setSearch}
              batchId={batchId}
              onBatchChange={setBatchId}
              status={status}
              onStatusChange={setStatus}
              batches={batches}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner label="Loading" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState message="No live classes scheduled yet" />
          ) : (
            <ul className="space-y-4">
              {filtered.map((c) => (
                <li key={c.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{c.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.batchName} · {c.courseTitle} · {c.teacherName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(c.scheduledAt).toLocaleString()} · {c.durationMinutes} min ·{" "}
                        <span className="font-medium">{c.status}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.status === "SCHEDULED" && (
                        <Button size="sm" variant="secondary" onClick={() => void handleStatusChange(c.id, "COMPLETED")}>
                          Mark completed
                        </Button>
                      )}
                      {c.status !== "CANCELLED" && (
                        <Button size="sm" variant="ghost" onClick={() => void handleCancel(c.id)}>
                          Cancel
                        </Button>
                      )}
                      <Button size="sm" variant="gold" onClick={() => setUploadTarget(uploadTarget === c.id ? null : c.id)}>
                        Upload recording
                      </Button>
                    </div>
                  </div>

                  {uploadTarget === c.id ? (
                    <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
                      <Input label="Recording title" value={uploadForm.title} onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))} />
                      <div className="mt-3">
                        <Input label="Description (optional)" value={uploadForm.description} onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div className="mt-3">
                        <label className="text-sm font-medium">Video file</label>
                        <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" className="mt-1 block w-full text-sm" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
                      </div>
                      <Button className="mt-3" size="sm" disabled={uploading} onClick={() => void handleUpload(c.id)}>
                        {uploading ? "Uploading..." : "Upload to batch storage"}
                      </Button>
                    </div>
                  ) : null}

                  {c.recordings && c.recordings.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-medium">Batch recordings ({c.recordingCount})</p>
                      {c.recordings.map((r) => (
                        <div key={r.id} className="rounded-xl border border-border p-3">
                          <p className="text-sm font-medium">{r.title}</p>
                          <RecordingPlayer
                            recording={{
                              title: r.title,
                              videoUrl: r.videoUrl,
                              videoStorageKey: null,
                              videoStorageProvider: "r2",
                              videoMimeType: "video/mp4",
                              videoFileName: r.title,
                            }}
                            className="mt-2 max-h-40 w-full rounded-lg bg-black object-contain"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">No recordings uploaded yet for this class.</p>
                  )}
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
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <p className="text-4xl">▶</p>
      <p className="mt-3 font-medium text-foreground">{message}</p>
    </div>
  );
}
