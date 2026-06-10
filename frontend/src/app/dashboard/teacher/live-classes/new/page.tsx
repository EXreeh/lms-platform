"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { LiveClassForm, type LiveClassFormValues } from "@/components/live-classes/live-class-form";
import { Button } from "@/components/ui/button";
import { fetchTeacherBatches } from "@/lib/batches-api";
import { scheduleLiveClass } from "@/lib/live-classes-api";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

const initialForm: LiveClassFormValues = {
  batchId: "",
  courseId: "",
  teacherId: "",
  title: "",
  description: "",
  scheduledAt: "",
  durationMinutes: "60",
  meetingProvider: "ZOOM",
  meetingUrl: "",
  meetingId: "",
  meetingPassword: "",
  startUrl: "",
  joinUrl: "",
};

export default function TeacherNewLiveClassPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState(initialForm);
  const [batches, setBatches] = useState<{ value: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchTeacherBatches().then((res) => {
      setBatches(res.data.map((b) => ({ value: b.id, label: b.name })));
    });
  }, []);

  async function handleCreate() {
    if (!form.batchId || !form.title || !form.scheduledAt) {
      toastError("Batch, title, and schedule are required");
      return;
    }
    setSaving(true);
    try {
      const res = await scheduleLiveClass(
        {
          batchId: form.batchId,
          title: form.title,
          description: form.description || undefined,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          durationMinutes: Number(form.durationMinutes) || 60,
          meetingProvider: form.meetingProvider,
          meetingUrl: form.meetingUrl || undefined,
          meetingId: form.meetingId || undefined,
          meetingPassword: form.meetingPassword || undefined,
          startUrl: form.startUrl || undefined,
          joinUrl: form.joinUrl || undefined,
        },
        "TEACHER",
      );
      success("Live class scheduled");
      router.push(`/dashboard/teacher/live-classes/${res.data.id}`);
    } catch (err) {
      toastError(formatApiError(err, "Failed to schedule"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell title="Schedule live class" description="Zoom link for your assigned batch." badge="Teacher">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1 space-y-4">
          <Link href="/dashboard/teacher/live-classes" className="text-sm text-primary hover:underline">
            ← Back
          </Link>
          <div className="rounded-2xl border border-border bg-card p-6">
            <LiveClassForm values={form} onChange={setForm} batches={batches} showStartUrl />
            <Button className="mt-4" variant="gold" disabled={saving} onClick={() => void handleCreate()}>
              {saving ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
