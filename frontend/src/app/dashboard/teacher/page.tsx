"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";

const upcomingFeatures = [
  "AI-assisted course builder",
  "Video & content uploads",
  "Automated quiz generation",
  "Student engagement analytics",
];

export default function TeacherDashboardPage() {
  return (
    <DashboardShell
      title="Teacher Studio"
      description="Create, manage, and optimize your courses with AI-powered tools designed for modern educators."
      badge="Educator Portal"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Planned modules" variant="gradient">
          <ul className="space-y-3">
            {upcomingFeatures.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-700/10 text-green-700 dark:bg-green-400/20 dark:text-green-400">
                  →
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Your studio" variant="default">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Upload courses, manage enrollments, and track learner outcomes — all from one
            professional workspace powered by Cognitiax AI.
          </p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 rounded-full gradient-brand" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Platform setup · 33% complete</p>
        </Card>
      </div>
    </DashboardShell>
  );
}
