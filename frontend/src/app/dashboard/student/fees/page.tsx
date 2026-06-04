"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Spinner } from "@/components/ui/spinner";
import { fetchStudentFees } from "@/lib/fees-api";
import type { StudentFeeDashboard } from "@/types/institute";
import { formatApiError } from "@/lib/format-api-error";

export default function StudentFeesPage() {
  const [data, setData] = useState<StudentFeeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchStudentFees();
        setData(res.data);
      } catch (err) {
        setError(formatApiError(err, "Failed to load fees"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardShell
      title="My Fees"
      description="View your institute fee status, payment history, and reminders."
      badge="Student Portal"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading fees" />
            </div>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : data ? (
            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Total fee" value={`₹${data.totalFee}`} icon="📋" />
                <StatCard label="Paid" value={`₹${data.paidFee}`} icon="✓" accent="green" />
                <StatCard label="Pending" value={`₹${data.pendingFee}`} icon="⏳" accent="gold" />
              </div>
              {data.plans.map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h2 className="font-serif font-bold">{plan.accessLabel}</h2>
                    <span className="text-sm text-muted-foreground">{plan.status}</span>
                  </div>
                  <p className="mt-2 text-sm">
                    Due {new Date(plan.dueDate).toLocaleDateString()} · Pending ₹{plan.pendingAmount}
                  </p>
                  {plan.payments && plan.payments.length > 0 && (
                    <ul className="mt-4 divide-y divide-border text-sm">
                      {plan.payments.map((p) => (
                        <li key={p.id} className="flex justify-between py-2">
                          <span>
                            ₹{p.amount} · {p.paymentMode}
                          </span>
                          <span>{new Date(p.paymentDate).toLocaleDateString()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {data.reminders.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="font-serif font-bold">Reminders</h2>
                  <ul className="mt-3 space-y-3 text-sm">
                    {data.reminders.map((r) => (
                      <li key={r.id}>
                        <p>{r.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.reminderDate).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
