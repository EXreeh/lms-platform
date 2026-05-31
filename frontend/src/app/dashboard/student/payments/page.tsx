"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchMyPayments } from "@/lib/payments-api";
import { formatApiError } from "@/lib/format-api-error";
import { formatPaymentAmount, type Payment } from "@/types/payment";
import { useToast } from "@/context/toast-context";

export default function StudentPaymentsPage() {
  const { error: toastError } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchMyPayments();
      setPayments(res.data.payments);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load payments"));
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardShell
      title="Payment History"
      description="View your course purchases on CognitiaX AI."
      badge="Student Portal"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-4xl">🧾</p>
              <h2 className="mt-4 font-serif text-xl font-bold">No payments yet</h2>
              <p className="mt-2 text-muted-foreground">
                Purchases for paid courses will appear here after checkout.
              </p>
              <Link href="/courses" className="mt-6 inline-block">
                <Button variant="gold">Browse courses</Button>
              </Link>
            </div>
          ) : (
            <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {payments.map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5"
                >
                  <div>
                    <p className="font-serif text-lg font-bold">{p.course?.title ?? "Course"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(p.createdAt).toLocaleString()} · {p.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{formatPaymentAmount(p.amount, p.currency)}</span>
                    {p.course?.slug && p.status === "CAPTURED" && (
                      <Link href={`/courses/${p.course.slug}/learn`}>
                        <Button variant="secondary" size="sm">
                          Open course
                        </Button>
                      </Link>
                    )}
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
