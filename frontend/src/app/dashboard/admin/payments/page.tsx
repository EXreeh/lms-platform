"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { brand } from "@/lib/design-tokens";

export default function AdminPaymentsPage() {
  return (
    <DashboardShell
      title="Revenue & Payments"
      description={`Payment reporting for ${brand.name} will appear here once Razorpay is configured.`}
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="font-serif text-xl font-bold text-foreground">Payments not configured yet</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Revenue widgets and transaction history are hidden until Razorpay credentials are added to
              the backend environment. No placeholder revenue data is shown.
            </p>
            <p className="mt-6 text-xs text-muted-foreground">
              To enable later: set <code className="rounded bg-muted px-1.5 py-0.5">RAZORPAY_KEY_ID</code> and{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">RAZORPAY_KEY_SECRET</code> in{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">backend/.env</code>.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
