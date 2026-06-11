"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  fetchStudentPaymentReceipt,
  type PaymentReceipt,
} from "@/lib/fee-payments-api";
import { formatApiError } from "@/lib/format-api-error";

export default function StudentPaymentReceiptPage() {
  const params = useParams();
  const paymentId = String(params.id);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchStudentPaymentReceipt(paymentId)
      .then((res) => setReceipt(res.data))
      .catch((err) => setError(formatApiError(err, "Failed to load receipt")))
      .finally(() => setLoading(false));
  }, [paymentId]);

  return (
    <DashboardShell title="Payment Receipt" description="Official payment receipt." badge="Student">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1">
          <Link href="/dashboard/student/payments" className="text-sm text-primary hover:underline">
            ← Payment history
          </Link>
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading receipt" />
            </div>
          ) : error ? (
            <p className="mt-4 text-red-600">{error}</p>
          ) : receipt ? (
            <div className="mt-6 max-w-lg rounded-2xl border border-border bg-card p-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">CognitiaX AI</p>
                <h2 className="mt-1 font-serif text-xl font-bold">Payment Receipt</h2>
                <p className="mt-1 text-sm text-muted-foreground">{receipt.receiptNumber}</p>
              </div>
              <dl className="mt-8 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Student</dt>
                  <dd className="font-medium">{receipt.studentName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Fee</dt>
                  <dd>{receipt.feeTitle}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="font-bold">₹{receipt.amount} {receipt.currency}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Paid on</dt>
                  <dd>
                    {receipt.paidAt ? new Date(receipt.paidAt).toLocaleString() : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Method</dt>
                  <dd>{receipt.paymentMethod ?? receipt.provider}</dd>
                </div>
                {receipt.transactionId && (
                  <div className="flex justify-between gap-4">
                    <dt className="shrink-0 text-muted-foreground">Transaction ID</dt>
                    <dd className="break-all text-right text-xs">{receipt.transactionId}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>{receipt.status}</dd>
                </div>
              </dl>
              <div className="mt-8 flex gap-3">
                <Button variant="secondary" onClick={() => window.print()}>
                  Print
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
