import type { FeePlan, FeeStatus } from "@lms/database";
import { Decimal } from "@prisma/client/runtime/library";

export function toNumber(value: Decimal | number): number {
  return typeof value === "number" ? value : Number(value);
}

export function computeFeeStatus(
  pendingAmount: number,
  paidAmount: number,
  dueDate: Date,
): FeeStatus {
  if (pendingAmount <= 0) {
    return "PAID";
  }
  if (new Date() > dueDate) {
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
  payments?: Array<{
    id: string;
    amount: Decimal;
    paymentMode: string;
    paymentDate: Date;
    note: string | null;
    createdAt: Date;
    recordedBy?: { firstName: string; lastName: string };
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
    dueDate: plan.dueDate.toISOString(),
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
      paymentMode: p.paymentMode,
      paymentDate: p.paymentDate.toISOString(),
      note: p.note,
      recordedByName: p.recordedBy
        ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}`
        : undefined,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}
