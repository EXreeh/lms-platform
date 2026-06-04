"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchLiveClasses } from "@/lib/live-classes-api";
import type { LiveClass } from "@/types/institute";

export default function StudentLiveClassesPage() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchLiveClasses({ upcoming: true }).then((res) => {
      setClasses(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardShell title="Live Classes" description="Upcoming live sessions for your batch." badge="Student Portal">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading" />
            </div>
          ) : classes.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              No upcoming live classes scheduled.
            </p>
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
