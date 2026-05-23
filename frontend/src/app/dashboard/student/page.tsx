"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";

const upcomingFeatures = [
  "AI-recommended course paths",
  "Interactive video lessons",
  "Smart quiz assessments",
  "Real-time progress tracking",
];

export default function StudentDashboardPage() {
  return (
    <DashboardShell
      title="Student Dashboard"
      description="Your personalized learning hub. AI-driven recommendations and progress insights will appear here soon."
      badge="Student Portal"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Coming soon" variant="gradient">
          <ul className="space-y-3">
            {upcomingFeatures.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-gold text-xs font-bold text-green-950">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Quick stats" variant="dashed">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Courses", value: "—" },
              { label: "Progress", value: "—" },
              { label: "Quizzes", value: "—" },
              { label: "Certificates", value: "—" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-card p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
