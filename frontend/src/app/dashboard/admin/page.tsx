"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DemoBanner } from "@/components/dashboard/demo-banner";
import { ModerationSection } from "@/components/dashboard/moderation-section";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";
import { fetchAdminDashboard } from "@/lib/dashboard-api";
import { getDemoAdminDashboard } from "@/lib/demo-dashboard";
import type { AdminDashboardData } from "@/types/dashboard";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function loadDashboard() {
    try {
      const res = await fetchAdminDashboard();
      if (res.data.isEmpty) {
        setData(getDemoAdminDashboard());
        setShowDemo(true);
      } else {
        setData(res.data);
        setShowDemo(false);
      }
    } catch {
      setData(getDemoAdminDashboard());
      setShowDemo(true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <DashboardShell
      title="Admin Command Center"
      description="Platform oversight, user management, and course moderation for Cognitiax AI."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1">
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" label="Loading admin dashboard" />
        </div>
      ) : data ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {showDemo && <DemoBanner />}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Students" value={data.stats.totalStudents} icon="🎓" accent="green" />
            <StatCard label="Teachers" value={data.stats.totalTeachers} icon="👨‍🏫" accent="gold" />
            <StatCard label="Total courses" value={data.stats.totalCourses} icon="📚" />
            <StatCard label="Published" value={data.stats.publishedCourses} icon="✓" accent="green" />
            <StatCard
              label="Pending review"
              value={data.stats.pendingModeration}
              icon="⏳"
              accent="gold"
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Card title="Recent registrations" variant="default">
              <ul className="divide-y divide-border">
                {data.recentRegistrations.map((user) => (
                  <li key={user.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {user.role}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Teacher management" variant="default">
              <ul className="divide-y divide-border">
                {data.teachers.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{t.name}</p>
                      <p className="text-muted-foreground">{t.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t.courseCount} course{t.courseCount !== 1 ? "s" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <ModerationSection
            courses={data.coursesForModeration}
            demoMode={showDemo}
            onPublished={() => void loadDashboard()}
          />

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-serif font-bold">Platform activity</h2>
            <div className="mt-4">
              <ActivityFeed
                items={data.recentRegistrations.slice(0, 5).map((u) => ({
                  id: u.id,
                  message: `${u.name} registered as ${u.role}`,
                  timestamp: u.createdAt,
                  type: "updated",
                }))}
              />
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/courses" className="font-medium text-green-700 dark:text-gold-400">
              View public catalog →
            </Link>
          </p>
        </motion.div>
      ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
