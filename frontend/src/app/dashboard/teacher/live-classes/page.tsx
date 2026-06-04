"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchLiveClasses } from "@/lib/live-classes-api";
import type { LiveClass } from "@/types/institute";

export default function TeacherLiveClassesPage() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchLiveClasses({ upcoming: true }).then((res) => {
      setClasses(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardShell title="Live Classes" description="Scheduled sessions for your batches." badge="Teacher Portal">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading" />
            </div>
          ) : (
            <ul className="space-y-4">
              {classes.map((c) => (
                <li key={c.id} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-serif font-bold">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {c.batchName} · {new Date(c.scheduledAt).toLocaleString()}
                  </p>
                  <Button className="mt-4" variant="secondary" disabled>
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
