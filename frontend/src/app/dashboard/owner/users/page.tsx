"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { fetchOwnerUsers } from "@/lib/owner-api";
import type { AdminUser } from "@/types/admin";

export default function OwnerUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchOwnerUsers({ limit: 50 })
      .then((res) => setUsers(res.data.users))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell title="All users" description="Platform-wide user directory." badge="Owner">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="OWNER" />
        <div className="min-w-0 flex-1">
          <Link href="/dashboard/owner" className="text-sm text-primary hover:underline">← Owner console</Link>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner label="Loading" /></div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/60">
                      <td className="p-4">{u.name}</td>
                      <td className="p-4">{u.email}</td>
                      <td className="p-4">{u.role}</td>
                      <td className="p-4">{u.suspended ? "Suspended" : "Active"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
