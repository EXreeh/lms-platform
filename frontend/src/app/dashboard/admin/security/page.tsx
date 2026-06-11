"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { fetchAdminSecurity } from "@/lib/admin-api";

export default function AdminSecurityPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchAdminSecurity()
      .then((res) => setSettings(res.data as Record<string, unknown>))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell title="Security" description="Production security configuration status." badge="Admin">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1">
          <Link href="/dashboard/admin" className="text-sm text-primary hover:underline">
            ← Admin dashboard
          </Link>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner label="Loading" />
            </div>
          ) : settings ? (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(settings).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-border bg-card p-4">
                  <dt className="text-xs uppercase text-muted-foreground">{key}</dt>
                  <dd className="mt-1 font-medium">{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
