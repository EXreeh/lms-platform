"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

const links = [
  { href: "/dashboard/owner/users", label: "All users", desc: "View and manage platform users" },
  { href: "/dashboard/owner/admins", label: "Administrators", desc: "Create and manage admin accounts" },
  { href: "/dashboard/owner/audit-logs", label: "Audit logs", desc: "Security and admin action history" },
  { href: "/dashboard/owner/security", label: "Security", desc: "Platform security configuration" },
];

export default function OwnerDashboardPage() {
  return (
    <DashboardShell title="Owner Console" description="Platform owner controls for CognitiaX AI LMS." badge="Owner">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="OWNER" />
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary"
            >
              <p className="font-serif font-bold">{item.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
