import type { FeePayment, FeePaymentProvider, FeePlan } from "@lms/database";
import { Decimal } from "@prisma/client/runtime/library";

export function toNumber(value: Decimal | number): number {
  return typeof value === "number" ? value : Number(value);
}

export function toPaise(amount: number): number {
  return Math.round(amount * 100);
}

export function mapPaymentModeToProvider(mode: string): FeePaymentProvider {
  switch (mode) {
    case "UPI":
      return "UPI_MANUAL";
    case "BANK_TRANSFER":
      return "BANK_TRANSFER";
    case "CARD":
      return "RAZORPAY";
    case "CASH":
    default:
      return "CASH";
  }
}

export function mapFeePayment(payment: FeePayment & {
  student?: { id: string; firstName: string; lastName: string; email: string };
  feePlan?: {
    id: string;
    title: string;
    course?: { id: string; title: string; slug: string } | null;
    batch?: { id: string; name: string } | null;
  };
  recordedBy?: { firstName: string; lastName: string } | null;
}) {
  return {
    id: payment.id,
    feePlanId: payment.feePlanId,
    studentId: payment.studentId,
    amount: toNumber(payment.amount),
    currency: payment.currency,
    provider: payment.provider,
    status: payment.status,
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    paymentMethod: payment.paymentMethod,
    receiptNumber: payment.receiptNumber,
    paidAt: payment.paidAt?.toISOString() ?? null,
    failureReason: payment.failureReason,
    note: payment.note,
    paymentMode: payment.paymentMode,
    paymentDate: payment.paymentDate?.toISOString() ?? payment.paidAt?.toISOString() ?? null,
    recordedByName: payment.recordedBy
      ? `${payment.recordedBy.firstName} ${payment.recordedBy.lastName}`.trim()
      : undefined,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    student: payment.student
      ? {
          id: payment.student.id,
          name: `${payment.student.firstName} ${payment.student.lastName}`.trim(),
          email: payment.student.email,
        }
      : undefined,
    feePlan: payment.feePlan
      ? {
          id: payment.feePlan.id,
          title: payment.feePlan.title,
          course: payment.feePlan.course ?? null,
          batch: payment.feePlan.batch ?? null,
        }
      : undefined,
  };
}

export function buildReceiptPayload(
  payment: ReturnType<typeof mapFeePayment>,
  plan: FeePlan & {
    student: { firstName: string; lastName: string; email: string };
    course?: { title: string } | null;
    batch?: { name: string } | null;
  },
) {
  return {
    receiptNumber: payment.receiptNumber,
    paymentId: payment.id,
    feePlanId: plan.id,
    feeTitle: plan.title,
    studentName: `${plan.student.firstName} ${plan.student.lastName}`.trim(),
    studentEmail: plan.student.email,
    courseName: plan.course?.title ?? null,
    batchName: plan.batch?.name ?? null,
    amount: payment.amount,
    currency: payment.currency,
    provider: payment.provider,
    paymentMethod: payment.paymentMethod,
    status: payment.status,
    transactionId: payment.razorpayPaymentId,
    paidAt: payment.paidAt,
    note: payment.note,
  };
}
