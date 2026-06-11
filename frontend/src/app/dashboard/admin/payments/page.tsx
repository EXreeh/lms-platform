"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchAdminFeePayments,
  fetchAdminPaymentStats,
  type FeePaymentRecord,
} from "@/lib/fee-payments-api";
import { formatApiError } from "@/lib/format-api-error";
import { useToast } from "@/context/toast-context";

export default function AdminPaymentsPage() {
  const { error: toastError } = useToast();
  const [stats, setStats] = useState<{
    totalAssigned: number;
    totalCollected: number;
    totalPending: number;
    overdueAmount: number;
    paymentCount: number;
    latestPayments: FeePaymentRecord[];
  } | null>(null);
  const [payments, setPayments] = useState<FeePaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        fetchAdminPaymentStats(),
        fetchAdminFeePayments({ limit: 50 }),
      ]);
      setStats(statsRes.data);
      setPayments(listRes.data.payments);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load payments"));
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardShell
      title="Payments"
      description="Institute fee collections and payment history."
      badge="Admin"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1">
          <Link href="/dashboard/admin/fees" className="text-sm text-primary hover:underline">
            ← Fee management
          </Link>
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading payments" />
            </div>
          ) : stats ? (
            <div className="mt-4 space-y-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total assigned" value={`₹${stats.totalAssigned}`} icon="📋" />
                <StatCard label="Collected" value={`₹${stats.totalCollected}`} icon="✓" accent="green" />
                <StatCard label="Pending" value={`₹${stats.totalPending}`} icon="⏳" accent="gold" />
                <StatCard label="Overdue" value={`₹${stats.overdueAmount}`} icon="!" />
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Student</th>
                      <th className="p-3">Fee</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Provider</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="p-3">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="p-3">{p.student?.name ?? "—"}</td>
                        <td className="p-3">{p.feePlan?.title ?? "—"}</td>
                        <td className="p-3">₹{p.amount}</td>
                        <td className="p-3">{p.provider}</td>
                        <td className="p-3">{p.status}</td>
                        <td className="p-3">
                          {p.status === "CAPTURED" ? (
                            <Link
                              href={`/dashboard/admin/payments/${p.id}/receipt`}
                              className="text-primary hover:underline"
                            >
                              {p.receiptNumber ?? "View"}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
