"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchStudentFeesDashboard } from "@/lib/fee-payments-api";
import { useFeePayment } from "@/hooks/use-fee-payment";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { MIN_INSTALLMENT_AMOUNT } from "@/lib/fee-installments";
import type { FeePlan, StudentFeeDashboard } from "@/types/institute";
import { formatApiError } from "@/lib/format-api-error";

function formatInr(n: number) {
  return n.toLocaleString("en-IN");
}

function FeePlanCard({ plan, onPaid }: { plan: FeePlan; onPaid: () => void }) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const { paying, payAmount, setPayAmount, startPayment, validationError, canPay } =
    useFeePayment({
      plan,
      userName: user?.name,
      userEmail: user?.email,
      onSuccess: (amount, receiptNumber, paymentId) => {
        success(
          receiptNumber
            ? `Payment of ₹${formatInr(amount)} successful! Receipt ${receiptNumber}`
            : `Payment of ₹${formatInr(amount)} successful!`,
        );
        onPaid();
        if (paymentId) {
          window.location.href = `/dashboard/student/payments/${paymentId}/receipt`;
        }
      },
      onError: (msg) => toastError(msg),
    });

  const showPay = plan.pendingAmount > 0 && plan.status !== "CANCELLED";
  const finalPaymentOnly = plan.pendingAmount > 0 && plan.pendingAmount < MIN_INSTALLMENT_AMOUNT;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <h2 className="font-serif font-bold">{plan.title}</h2>
          {plan.course && (
            <p className="text-sm text-muted-foreground">Course: {plan.course.title}</p>
          )}
          {plan.batch && (
            <p className="text-sm text-muted-foreground">Batch: {plan.batch.name}</p>
          )}
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{plan.status}</span>
      </div>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <div>Total Fee: ₹{formatInr(plan.totalAmount)}</div>
        <div>Paid: ₹{formatInr(plan.paidAmount)}</div>
        <div className="font-medium text-amber-700">Pending: ₹{formatInr(plan.pendingAmount)}</div>
      </div>

      {plan.dueDate && (
        <p className="mt-2 text-sm text-muted-foreground">
          Due {new Date(plan.dueDate).toLocaleDateString()}
        </p>
      )}

      {showPay && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {finalPaymentOnly ? (
            <p className="text-sm font-medium text-primary">
              Pay remaining ₹{formatInr(plan.pendingAmount)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Minimum installment amount is ₹10,000
            </p>
          )}

          <Input
            label="Enter amount (₹)"
            type="number"
            min={finalPaymentOnly ? plan.pendingAmount : MIN_INSTALLMENT_AMOUNT}
            max={plan.pendingAmount}
            step="1"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />

          {!finalPaymentOnly && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPayAmount(String(MIN_INSTALLMENT_AMOUNT))}
              >
                ₹10,000
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPayAmount(String(Math.min(20_000, plan.pendingAmount)))}
              >
                ₹20,000
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPayAmount(String(plan.pendingAmount))}
              >
                Pay Full ₹{formatInr(plan.pendingAmount)}
              </Button>
            </div>
          )}

          {validationError && (
            <p className="text-sm text-red-600">{validationError}</p>
          )}

          <Button onClick={() => void startPayment()} disabled={paying || !canPay}>
            {paying ? "Processing…" : "Pay Now"}
          </Button>
        </div>
      )}

      {plan.payments && plan.payments.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-muted-foreground">Payment history</h3>
          <ul className="mt-2 divide-y divide-border text-sm">
            {plan.payments.map((p) => (
              <li key={p.id} className="flex justify-between py-2">
                <span>
                  ₹{formatInr(p.amount)} · {p.paymentMethod ?? p.provider ?? p.paymentMode ?? "Payment"}
                  {p.receiptNumber ? ` · ${p.receiptNumber}` : ""}
                </span>
                <span>
                  {(p.paidAt ?? p.paymentDate)
                    ? new Date(p.paidAt ?? p.paymentDate!).toLocaleDateString()
                    : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function StudentFeesPage() {
  const [data, setData] = useState<StudentFeeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchStudentFeesDashboard();
      setData(res.data);
    } catch (err) {
      setError(formatApiError(err, "Failed to load fees"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardShell
      title="My Fees"
      description="Pay institute fees in installments via Razorpay."
      badge="Student Portal"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex justify-end">
            <Link href="/dashboard/student/payments" className="text-sm text-primary hover:underline">
              Payment history →
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading fees" />
            </div>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : data ? (
            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Total fee" value={`₹${data.totalFee.toLocaleString("en-IN")}`} icon="📋" />
                <StatCard label="Paid" value={`₹${data.paidFee.toLocaleString("en-IN")}`} icon="✓" accent="green" />
                <StatCard label="Pending" value={`₹${data.pendingFee.toLocaleString("en-IN")}`} icon="⏳" accent="gold" />
              </div>
              {data.plans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fee plans assigned yet.</p>
              ) : (
                data.plans.map((plan) => (
                  <FeePlanCard key={plan.id} plan={plan} onPaid={() => void load()} />
                ))
              )}
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
