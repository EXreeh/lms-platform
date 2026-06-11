"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { fetchOwnerAuditLogs } from "@/lib/owner-api";

export default function OwnerAuditLogsPage() {
  const [logs, setLogs] = useState<Array<{ id: string; action: string; createdAt: string; actorId: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchOwnerAuditLogs({ limit: 50 })
      .then((res) => setLogs(res.data.logs))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell title="Audit logs" description="Security and administrative actions." badge="Owner">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="OWNER" />
        <div className="min-w-0 flex-1">
          <Link href="/dashboard/owner" className="text-sm text-primary hover:underline">← Owner console</Link>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner label="Loading" /></div>
          ) : logs.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">No audit entries yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {logs.map((log) => (
                <li key={log.id} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
                  <span className="font-medium">{log.action}</span>
                  <span className="text-muted-foreground"> · {new Date(log.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
