"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { fetchStudentFeePayments, type FeePaymentRecord } from "@/lib/fee-payments-api";
import { formatApiError } from "@/lib/format-api-error";

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState<FeePaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchStudentFeePayments()
      .then((res) => setPayments(res.data))
      .catch((err) => setError(formatApiError(err, "Failed to load payments")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell
      title="Payment History"
      description="Your institute fee payment records."
      badge="Student Portal"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1">
          <Link href="/dashboard/student/fees" className="text-sm text-primary hover:underline">
            ← My fees
          </Link>
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading" />
            </div>
          ) : error ? (
            <p className="mt-4 text-red-600">{error}</p>
          ) : payments.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Fee</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Method</th>
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
                      <td className="p-3">{p.feePlan?.title ?? "—"}</td>
                      <td className="p-3">₹{p.amount}</td>
                      <td className="p-3">{p.paymentMethod ?? p.provider}</td>
                      <td className="p-3">{p.status}</td>
                      <td className="p-3">
                        {p.status === "CAPTURED" ? (
                          <Link
                            href={`/dashboard/student/payments/${p.id}/receipt`}
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
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
