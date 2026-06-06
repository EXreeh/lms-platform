"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Spinner } from "@/components/ui/spinner";
import { fetchMyTeacherSalary } from "@/lib/teacher-salary-api";
import type { SalaryStatus, TeacherSalaryDashboard } from "@/types/institute";
import { formatApiError } from "@/lib/format-api-error";

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleString("en", { month: "long" }),
);

function statusBadge(status: SalaryStatus) {
  const styles =
    status === "PAID"
      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
      : status === "HOLD"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        : "bg-muted text-muted-foreground";
  const label = status === "PAID" ? "Paid" : status === "HOLD" ? "On hold" : "Pending";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>{label}</span>
  );
}

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
  const currentPeriod = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

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
            <div className="flex justify-center py-16">
              <Spinner label="Loading salary" />
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
                        value={`₹${current.netSalary}`}
                        icon="💰"
                        accent="gold"
                      />
                      <StatCard label="Base" value={`₹${current.baseSalary}`} icon="📋" />
                      <StatCard label="Bonus" value={`₹${current.bonus}`} icon="✨" accent="green" />
                      <StatCard
                        label="Deductions"
                        value={`₹${current.deductions}`}
                        icon="−"
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
                      <span className="text-sm text-muted-foreground">Payment status:</span>
                      {statusBadge(current.status)}
                      {current.paidAt && (
                        <span className="text-sm text-muted-foreground">
                          Paid on {new Date(current.paidAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {current.note && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Note: </span>
                        {current.note}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-4 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
                    No salary record has been created for this month yet. Your institute admin
                    will add it when ready.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif font-bold">Salary history</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Read-only view of your past salary records.
                </p>
                {data?.history.length ? (
                  <ul className="mt-4 divide-y divide-border text-sm">
                    {data.history.map((row) => (
                      <li key={row.id} className="flex flex-wrap items-center gap-3 py-3">
                        <span className="min-w-[8rem] font-medium">
                          {MONTHS[row.month - 1]} {row.year}
                        </span>
                        <span>₹{row.netSalary}</span>
                        {statusBadge(row.status)}
                        {row.paidAt && (
                          <span className="text-xs text-muted-foreground">
                            Paid {new Date(row.paidAt).toLocaleDateString()}
                          </span>
                        )}
                        {row.note && (
                          <span className="w-full text-xs text-muted-foreground">{row.note}</span>
                        )}
                      </li>
                    ))}
                  </ul>
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
