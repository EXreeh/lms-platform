"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { fetchLiveClasses, scheduleLiveClass } from "@/lib/live-classes-api";
import { fetchBatches } from "@/lib/batches-api";
import type { LiveClass } from "@/types/institute";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

export default function AdminLiveClassesPage() {
  const { success, error: toastError } = useToast();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [batches, setBatches] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ batchId: "", title: "", scheduledAt: "", duration: "60" });

  useEffect(() => {
    void (async () => {
      try {
        const [c, b] = await Promise.all([fetchLiveClasses(), fetchBatches()]);
        setClasses(c.data);
        setBatches(b.data.map((x) => ({ value: x.id, label: x.name })));
      } catch (err) {
        toastError(formatApiError(err, "Failed to load"));
      } finally {
        setLoading(false);
      }
    })();
  }, [toastError]);

  async function handleSchedule() {
    try {
      await scheduleLiveClass({
        batchId: form.batchId,
        title: form.title,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        duration: Number(form.duration),
      });
      success("Live class scheduled");
      const res = await fetchLiveClasses({ upcoming: true });
      setClasses(res.data);
    } catch (err) {
      toastError(formatApiError(err, "Failed to schedule"));
    }
  }

  return (
    <DashboardShell
      title="Live Classes"
      description="Schedule placeholder sessions — custom video classes coming soon."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif font-bold">Schedule class</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Select
                label="Batch"
                options={[{ value: "", label: "Select batch" }, ...batches]}
                value={form.batchId}
                onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))}
              />
              <Input
                label="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              <Input
                label="Date & time"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
              />
              <Input
                label="Duration (minutes)"
                type="number"
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              />
            </div>
            <Button className="mt-4" variant="gold" onClick={() => void handleSchedule()}>
              Schedule
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner label="Loading" />
            </div>
          ) : (
            <ul className="space-y-3">
              {classes.map((c) => (
                <li key={c.id} className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-medium">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {c.batchName} · {new Date(c.scheduledAt).toLocaleString()} · {c.status}
                  </p>
                  <Button className="mt-3" variant="secondary" disabled>
                    {c.joinMessage}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
