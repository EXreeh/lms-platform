"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ModerationSection } from "@/components/dashboard/moderation-section";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchAdminDashboard } from "@/lib/dashboard-api";
import type { AdminDashboardData } from "@/types/dashboard";
import { ApiClientError } from "@/lib/api";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadDashboard() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAdminDashboard();
      setData(res.data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load dashboard");
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
      description="Platform oversight, user management, and course moderation for CognitiaX AI."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" label="Loading admin dashboard" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <Button className="mt-4" variant="secondary" onClick={() => void loadDashboard()}>
                Retry
              </Button>
            </div>
          ) : data ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                <StatCard label="Students" value={data.stats.totalStudents} icon="🎓" accent="green" />
                <StatCard label="Teachers" value={data.stats.totalTeachers} icon="👨‍🏫" accent="gold" />
                <StatCard label="Courses" value={data.stats.totalCourses} icon="📚" />
                <StatCard label="Enrollments" value={data.stats.totalEnrollments} icon="📋" accent="green" />
                <StatCard label="Active users" value={data.stats.activeUsers} icon="⚡" accent="gold" />
                <StatCard label="Published" value={data.stats.publishedCourses} icon="✓" accent="green" />
                <StatCard label="Pending review" value={data.stats.pendingModeration} icon="⏳" accent="gold" />
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/admin/users">
                  <Button variant="gold">Manage users</Button>
                </Link>
                <Link href="/dashboard/admin/review">
                  <Button variant="gold">Review queue</Button>
                </Link>
                <Link href="/dashboard/admin/activity">
                  <Button variant="secondary">View activity</Button>
                </Link>
                <Link href="/dashboard/admin/payments">
                  <Button variant="secondary">Revenue & payments</Button>
                </Link>
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

                <Card title="Teacher ownership" variant="default">
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

          <ModerationSection courses={data.coursesForModeration} onUpdated={() => void loadDashboard()} />

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-serif font-bold">Platform activity</h2>
                  <Link
                    href="/dashboard/admin/activity"
                    className="text-sm font-medium text-green-700 dark:text-gold-400"
                  >
                    View all →
                  </Link>
                </div>
                <div className="mt-4">
                  <ActivityFeed
                    items={data.activityFeed.map((a) => ({
                      id: a.id,
                      message: a.message,
                      timestamp: a.timestamp,
                      type: a.type,
                    }))}
                    emptyMessage="Activity will appear as users interact with the platform"
                  />
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
