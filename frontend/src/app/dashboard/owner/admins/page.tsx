"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { fetchOwnerAdmins } from "@/lib/owner-api";
import type { AdminUser } from "@/types/admin";

export default function OwnerAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchOwnerAdmins()
      .then((res) => setAdmins(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell title="Administrators" description="Manage institute admin accounts." badge="Owner">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="OWNER" />
        <div className="min-w-0 flex-1">
          <Link href="/dashboard/owner" className="text-sm text-primary hover:underline">← Owner console</Link>
          <p className="mt-4 text-sm text-muted-foreground">Create admins from Admin → Users or via Owner API.</p>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner label="Loading" /></div>
          ) : (
            <ul className="mt-4 space-y-3">
              {admins.map((a) => (
                <li key={a.id} className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-muted-foreground">{a.email} · {a.role}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
