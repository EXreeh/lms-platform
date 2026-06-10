"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LiveClassForm,
  type LiveClassFormValues,
} from "@/components/live-classes/live-class-form";
import { JoinLiveClassButton } from "@/components/live-classes/join-live-class-button";
import { RecordingPlayer } from "@/components/live-classes/recording-player";
import {
  fetchLiveClass,
  updateLiveClass,
  updateLiveClassStatus,
  uploadLiveClassRecording,
} from "@/lib/live-classes-api";
import type { LiveClass } from "@/types/institute";
import { formatApiError } from "@/lib/format-api-error";
import { useToast } from "@/context/toast-context";

interface LiveClassDetailPanelProps {
  liveClass: LiveClass;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  batches: { value: string; label: string }[];
  onUpdated: (liveClass: LiveClass) => void;
}

function toFormValues(liveClass: LiveClass): LiveClassFormValues {
  const scheduled = new Date(liveClass.scheduledAt);
  const local = new Date(scheduled.getTime() - scheduled.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  return {
    batchId: liveClass.batchId,
    courseId: liveClass.courseId,
    teacherId: liveClass.teacherId,
    title: liveClass.title,
    description: liveClass.description ?? "",
    scheduledAt: local,
    durationMinutes: String(liveClass.durationMinutes),
    meetingProvider: liveClass.meetingProvider ?? "ZOOM",
    meetingUrl: liveClass.meetingUrl ?? liveClass.liveUrl ?? "",
    meetingId: liveClass.meetingId ?? "",
    meetingPassword: liveClass.meetingPassword ?? "",
    startUrl: liveClass.startUrl ?? "",
    joinUrl: liveClass.joinUrl ?? "",
  };
}

export function LiveClassDetailPanel({
  liveClass,
  role,
  batches,
  onUpdated,
}: LiveClassDetailPanelProps) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState(() => toFormValues(liveClass));
  const [saving, setSaving] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const canManage = role === "ADMIN" || role === "TEACHER";

  async function handleSave() {
    setSaving(true);
    try {
      const res = await updateLiveClass(
        liveClass.id,
        {
          title: form.title,
          description: form.description || null,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          durationMinutes: Number(form.durationMinutes) || 60,
          meetingProvider: form.meetingProvider,
          meetingUrl: form.meetingUrl || undefined,
          meetingId: form.meetingId || undefined,
          meetingPassword: form.meetingPassword || undefined,
          startUrl: form.startUrl || undefined,
          joinUrl: form.joinUrl || undefined,
        },
        role === "TEACHER" ? "TEACHER" : "ADMIN",
      );
      onUpdated(res.data);
      success("Live class updated");
    } catch (err) {
      toastError(formatApiError(err, "Update failed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(status: string) {
    try {
      const res = await updateLiveClassStatus(
        liveClass.id,
        status,
        role === "TEACHER" ? "TEACHER" : "ADMIN",
      );
      onUpdated(res.data);
      success(`Status updated to ${status}`);
    } catch (err) {
      toastError(formatApiError(err, "Status update failed"));
    }
  }

  async function handleUpload() {
    if (!uploadFile || !uploadTitle.trim()) {
      toastError("Recording title and video file required");
      return;
    }
    setUploading(true);
    try {
      await uploadLiveClassRecording(
        liveClass.id,
        uploadFile,
        { title: uploadTitle.trim() },
        role === "TEACHER" ? "TEACHER" : "ADMIN",
      );
      const refreshed = await fetchLiveClass(liveClass.id);
      onUpdated(refreshed.data);
      success("Recording uploaded");
      setUploadFile(null);
      setUploadTitle("");
    } catch (err) {
      toastError(formatApiError(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  }

  if (role === "STUDENT") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h1 className="font-serif text-2xl font-bold">{liveClass.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {liveClass.courseTitle} · {liveClass.batchName} · {liveClass.teacherName}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(liveClass.scheduledAt).toLocaleString()} · {liveClass.durationMinutes} min
          </p>
          <p className="mt-2 text-sm font-medium uppercase">{liveClass.status}</p>
          <div className="mt-4">
            <JoinLiveClassButton liveClass={liveClass} size="md" />
          </div>
          {liveClass.meetingPassword ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Meeting password: <span className="font-mono">{liveClass.meetingPassword}</span>
            </p>
          ) : null}
        </div>
        {liveClass.recordings?.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
            <p className="font-medium">{r.title}</p>
            <RecordingPlayer
              recording={{
                title: r.title,
                videoUrl: r.videoUrl,
                videoStorageKey: null,
                videoStorageProvider: "r2",
                videoMimeType: "video/mp4",
                videoFileName: r.title,
              }}
              className="mt-3 max-h-64 w-full rounded-xl bg-black object-contain"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-2xl font-bold">Edit live class</h1>
          <JoinLiveClassButton liveClass={liveClass} />
        </div>
        <div className="mt-6">
          <LiveClassForm
            values={form}
            onChange={setForm}
            batches={batches}
            showStartUrl
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="gold" disabled={saving} onClick={() => void handleSave()}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {liveClass.status === "SCHEDULED" && (
            <>
              <Button variant="secondary" onClick={() => void handleStatus("LIVE")}>
                Mark live
              </Button>
              <Button variant="secondary" onClick={() => void handleStatus("COMPLETED")}>
                Mark completed
              </Button>
              <Button variant="ghost" onClick={() => void handleStatus("CANCELLED")}>
                Cancel class
              </Button>
            </>
          )}
          {liveClass.status === "LIVE" && (
            <Button variant="secondary" onClick={() => void handleStatus("COMPLETED")}>
              Mark completed
            </Button>
          )}
        </div>
      </div>

      {canManage ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif font-bold">Upload batch recording</h2>
          <div className="mt-4 space-y-3">
            <Input label="Recording title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
            <input type="file" accept="video/*" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
            <Button disabled={uploading} onClick={() => void handleUpload()}>
              {uploading ? "Uploading..." : "Upload to R2"}
            </Button>
          </div>
        </div>
      ) : null}

      {liveClass.recordings?.map((r) => (
        <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
          <p className="font-medium">{r.title}</p>
          <RecordingPlayer
            recording={{
              title: r.title,
              videoUrl: r.videoUrl,
              videoStorageKey: null,
              videoStorageProvider: "r2",
              videoMimeType: "video/mp4",
              videoFileName: r.title,
            }}
            className="mt-3 max-h-48 w-full rounded-xl bg-black object-contain"
          />
        </div>
      ))}
    </div>
  );
}
