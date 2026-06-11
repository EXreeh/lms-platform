import type { FeePlan, FeeStatus } from "@lms/database";
import { Decimal } from "@prisma/client/runtime/library";

export function toNumber(value: Decimal | number): number {
  return typeof value === "number" ? value : Number(value);
}

export function computeFeeStatus(
  pendingAmount: number,
  paidAmount: number,
  dueDate: Date | null | undefined,
): FeeStatus {
  if (pendingAmount <= 0) {
    return "PAID";
  }
  if (dueDate && new Date() > dueDate) {
    return "OVERDUE";
  }
  if (paidAmount > 0) {
    return "PARTIAL";
  }
  return "PENDING";
}

export function mapFeePlan(plan: FeePlan & {
  student?: { id: string; firstName: string; lastName: string; email: string };
  course?: { id: string; title: string; slug: string } | null;
  batch?: { id: string; name: string } | null;
  title?: string;
  description?: string | null;
  currency?: string;
  allowPartialPayments?: boolean;
  payments?: Array<{
    id: string;
    amount: Decimal;
    provider?: string;
    status?: string;
    paymentMode: string | null;
    paymentMethod?: string | null;
    receiptNumber?: string | null;
    razorpayPaymentId?: string | null;
    paymentDate: Date | null;
    paidAt?: Date | null;
    note: string | null;
    createdAt: Date;
    recordedBy?: { firstName: string; lastName: string } | null;
  }>;
}) {
  const total = toNumber(plan.totalAmount);
  const paid = toNumber(plan.paidAmount);
  const pending = toNumber(plan.pendingAmount);

  return {
    id: plan.id,
    studentId: plan.studentId,
    courseId: plan.courseId,
    batchId: plan.batchId,
    totalAmount: total,
    paidAmount: paid,
    pendingAmount: pending,
    title: plan.title,
    description: plan.description ?? null,
    currency: plan.currency,
    allowPartialPayments: plan.allowPartialPayments,
    dueDate: plan.dueDate?.toISOString() ?? null,
    status: plan.status,
    accessGranted: plan.accessGranted,
    lifetimeAccess: plan.lifetimeAccess,
    accessLabel: plan.lifetimeAccess
      ? "Lifetime access granted"
      : plan.accessGranted
        ? "Active"
        : pending > 0
          ? "Pending fee"
          : "Active",
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    student: plan.student
      ? {
          id: plan.student.id,
          name: `${plan.student.firstName} ${plan.student.lastName}`,
          email: plan.student.email,
        }
      : undefined,
    course: plan.course ?? null,
    batch: plan.batch ?? null,
    payments: plan.payments?.map((p) => ({
      id: p.id,
      amount: toNumber(p.amount),
      provider: p.provider,
      status: p.status,
      paymentMode: p.paymentMode,
      paymentMethod: p.paymentMethod,
      receiptNumber: p.receiptNumber,
      razorpayPaymentId: p.razorpayPaymentId,
      paymentDate: (p.paidAt ?? p.paymentDate)?.toISOString() ?? null,
      paidAt: p.paidAt?.toISOString() ?? null,
      note: p.note,
      recordedByName: p.recordedBy
        ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}`
        : undefined,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}
