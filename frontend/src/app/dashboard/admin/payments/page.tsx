"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchRevenueAnalytics, fetchAllPayments } from "@/lib/payments-api";
import { formatApiError } from "@/lib/format-api-error";
import { formatPaymentAmount, type Payment, type RevenueAnalytics } from "@/types/payment";
import { useToast } from "@/context/toast-context";

export default function AdminPaymentsPage() {
  const { error: toastError } = useToast();
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, paymentsRes] = await Promise.all([
        fetchRevenueAnalytics(),
        fetchAllPayments(),
      ]);
      setAnalytics(analyticsRes.data.analytics);
      setPayments(paymentsRes.data.payments);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load payment data"));
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardShell
      title="Revenue & Payments"
      description="Track course sales, transactions, and platform revenue on CognitiaX AI."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-8">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : analytics ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  label="Total revenue"
                  value={formatPaymentAmount(analytics.totalRevenue, analytics.currency)}
                  icon="💰"
                  accent="gold"
                />
                <StatCard
                  label="Transactions"
                  value={analytics.totalTransactions}
                  icon="🧾"
                  accent="green"
                />
                <StatCard
                  label="Paid courses sold"
                  value={analytics.courseRevenue.length}
                  icon="📚"
                />
              </div>

              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-lg font-bold">Course-wise revenue</h2>
                {analytics.courseRevenue.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No paid enrollments yet.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {analytics.courseRevenue.map((row) => (
                      <li
                        key={row.courseId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-4 text-sm"
                      >
                        <div>
                          <p className="font-semibold">{row.course?.title ?? "Unknown course"}</p>
                          <p className="text-muted-foreground">{row.transactions} transaction(s)</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-green-700 dark:text-green-400">
                            {formatPaymentAmount(row.revenue, analytics.currency)}
                          </span>
                          {row.course?.slug && (
                            <Link href={`/courses/${row.course.slug}`}>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </Link>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-lg font-bold">Recent payments</h2>
                {analytics.recentPayments.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No payments recorded yet.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {analytics.recentPayments.map((p) => (
                      <li
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-4 text-sm"
                      >
                        <div>
                          <p className="font-semibold">{p.student?.name ?? "Student"}</p>
                          <p className="text-muted-foreground">
                            {p.course?.title ?? "Course"} · {new Date(p.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="font-bold">{formatPaymentAmount(p.amount, p.currency)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-lg font-bold">All payment records</h2>
                {payments.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No payment records.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="pb-2 pr-4 font-medium">Student</th>
                          <th className="pb-2 pr-4 font-medium">Course</th>
                          <th className="pb-2 pr-4 font-medium">Amount</th>
                          <th className="pb-2 pr-4 font-medium">Status</th>
                          <th className="pb-2 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} className="border-b border-border/60">
                            <td className="py-3 pr-4">{p.student?.email ?? p.studentId}</td>
                            <td className="py-3 pr-4">{p.course?.title ?? p.courseId}</td>
                            <td className="py-3 pr-4">{formatPaymentAmount(p.amount, p.currency)}</td>
                            <td className="py-3 pr-4">
                              <span
                                className={
                                  p.status === "CAPTURED"
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-muted-foreground"
                                }
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </motion.div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
