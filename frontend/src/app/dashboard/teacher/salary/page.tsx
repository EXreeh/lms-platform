"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { SalaryStatusBadge } from "@/components/institute/salary-status-badge";
import { EmptyState } from "@/components/courses/empty-state";
import { DashboardStatsSkeleton } from "@/components/learning/learning-skeleton";
import { Spinner } from "@/components/ui/spinner";
import { fetchMyTeacherSalary } from "@/lib/teacher-salary-api";
import { formatInr, MONTH_OPTIONS } from "@/lib/salary-utils";
import type { TeacherSalaryDashboard } from "@/types/institute";
import { formatApiError } from "@/lib/format-api-error";

export default function TeacherSalaryPage() {
  const [data, setData] = useState<TeacherSalaryDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchMyTeacherSalary();
        setData(res.data);
      } catch (err) {
        setError(formatApiError(err, "Failed to load salary"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const current = data?.currentMonth;
  const now = new Date();
  const currentPeriod = `${MONTH_OPTIONS[now.getMonth()]?.label} ${now.getFullYear()}`;

  return (
    <DashboardShell
      title="My Salary"
      description="View-only access to your institute salary records. Contact admin for questions."
      badge="Teacher Portal"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="space-y-8">
              <DashboardStatsSkeleton />
              <div className="flex justify-center py-8">
                <Spinner label="Loading salary" />
              </div>
            </div>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <div className="space-y-8">
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">
                  Current month — {currentPeriod}
                </h2>
                {current ? (
                  <>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard
                        label="Net salary"
                        value={formatInr(current.netSalary)}
                        icon="💰"
                        accent="gold"
                      />
                      <StatCard label="Base" value={formatInr(current.baseSalary)} icon="📋" />
                      <StatCard
                        label="Bonus"
                        value={formatInr(current.bonus)}
                        icon="✨"
                        accent="green"
                      />
                      <StatCard label="Deductions" value={formatInr(current.deductions)} icon="−" />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
                      <span className="text-sm text-muted-foreground">Payment status:</span>
                      <SalaryStatusBadge status={current.status} />
                      {current.paidAt && (
                        <span className="text-sm text-muted-foreground">
                          Paid on {new Date(current.paidAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {current.note && (
                      <p className="mt-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                        <span className="font-medium text-foreground">Note from admin: </span>
                        {current.note}
                      </p>
                    )}
                  </>
                ) : (
                  <EmptyState
                    title="No salary for this month"
                    description="Your institute admin will add your salary record when ready."
                    icon="💰"
                  />
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif font-bold">Salary history</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Read-only view of your past salary records.
                </p>
                {data?.history.length ? (
                  <>
                    <ul className="mt-4 divide-y divide-border text-sm md:hidden">
                      {data.history.map((row) => (
                        <li key={row.id} className="py-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">
                              {MONTH_OPTIONS[row.month - 1]?.label} {row.year}
                            </span>
                            <SalaryStatusBadge status={row.status} />
                          </div>
                          <p className="mt-1 font-semibold">{formatInr(row.netSalary)}</p>
                          {row.note && (
                            <p className="mt-1 text-xs text-muted-foreground">{row.note}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                    <div className="-mx-1 mt-4 hidden overflow-x-auto md:block">
                      <table className="w-full min-w-[560px] text-left text-sm">
                        <thead className="text-muted-foreground">
                          <tr>
                            <th className="p-3 font-medium">Period</th>
                            <th className="p-3 font-medium">Net</th>
                            <th className="p-3 font-medium">Status</th>
                            <th className="p-3 font-medium">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.history.map((row) => (
                            <tr key={row.id} className="border-t border-border/60">
                              <td className="p-3 font-medium">
                                {MONTH_OPTIONS[row.month - 1]?.label} {row.year}
                              </td>
                              <td className="p-3">{formatInr(row.netSalary)}</td>
                              <td className="p-3">
                                <SalaryStatusBadge status={row.status} />
                              </td>
                              <td className="p-3 text-muted-foreground">{row.note ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">No salary history yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
