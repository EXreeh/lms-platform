"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";

const upcomingFeatures = [
  "User & role management",
  "Platform-wide analytics",
  "Billing & payment oversight",
  "Institution configuration",
];

export default function AdminDashboardPage() {
  return (
    <DashboardShell
      title="Admin Command Center"
      description="Full platform oversight for Cognitiax AI. Manage users, monitor health, and configure institutional settings."
      badge="Administrator"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {[
          { label: "Total users", value: "—", trend: "Live data soon" },
          { label: "Active courses", value: "—", trend: "Live data soon" },
          { label: "System health", value: "100%", trend: "All systems operational" },
        ].map((metric) => (
          <Card key={metric.label} className="text-center">
            <p className="text-3xl font-bold text-foreground">{metric.value}</p>
            <p className="mt-1 font-medium text-foreground">{metric.label}</p>
            <p className="mt-2 text-xs text-muted-foreground">{metric.trend}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6">
        <Card title="Admin capabilities (planned)" variant="gradient">
          <ul className="grid gap-3 sm:grid-cols-2">
            {upcomingFeatures.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </DashboardShell>
  );
}
