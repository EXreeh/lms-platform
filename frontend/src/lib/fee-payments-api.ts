import { apiRequest } from "./api";
import type { FeePlan, StudentFeeDashboard } from "@/types/institute";

export interface FeePaymentRecord {
  id: string;
  feePlanId: string;
  studentId: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  paymentMethod: string | null;
  receiptNumber: string | null;
  paidAt: string | null;
  failureReason: string | null;
  note: string | null;
  paymentDate: string | null;
  recordedByName?: string;
  createdAt: string;
  updatedAt: string;
  student?: { id: string; name: string; email: string };
  feePlan?: {
    id: string;
    title: string;
    course: { id: string; title: string; slug: string } | null;
    batch: { id: string; name: string } | null;
  };
}

export interface PaymentReceipt {
  receiptNumber: string | null;
  paymentId: string;
  feePlanId: string;
  feeTitle: string;
  studentName: string;
  studentEmail: string;
  courseName: string | null;
  batchName: string | null;
  amount: number;
  currency: string;
  provider: string;
  paymentMethod: string | null;
  status: string;
  transactionId: string | null;
  paidAt: string | null;
  note: string | null;
}

export interface CreateOrderResponse {
  razorpayKeyId: string;
  orderId: string;
  amount: number;
  currency: string;
  feeTitle: string;
  student: { name: string; email: string };
}

function queryString(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function fetchStudentFeesDashboard() {
  return apiRequest<{ success: boolean; data: StudentFeeDashboard }>("/student/fees", {
    auth: true,
  });
}

export function fetchStudentFeePlan(feePlanId: string) {
  return apiRequest<{ success: boolean; data: FeePlan }>(`/student/fees/${feePlanId}`, {
    auth: true,
  });
}

export function createFeePaymentOrder(feePlanId: string, amount: number) {
  return apiRequest<{ success: boolean; data: CreateOrderResponse }>(
    `/student/fees/${feePlanId}/create-order`,
    { method: "POST", body: { amount }, auth: true },
  );
}

export function verifyFeePayment(body: {
  feePlanId: string;
  amount: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  return apiRequest<{
    success: boolean;
    data: { message: string; payment: FeePaymentRecord; receiptNumber: string | null };
  }>("/student/payments/verify", { method: "POST", body, auth: true });
}

export function fetchStudentFeePayments() {
  return apiRequest<{ success: boolean; data: FeePaymentRecord[] }>("/student/payments", {
    auth: true,
  });
}

export function fetchStudentPaymentReceipt(paymentId: string) {
  return apiRequest<{ success: boolean; data: PaymentReceipt }>(
    `/student/payments/${paymentId}/receipt`,
    { auth: true },
  );
}

export function fetchAdminFeePayments(params: {
  page?: number;
  limit?: number;
  studentId?: string;
  status?: string;
} = {}) {
  return apiRequest<{
    success: boolean;
    data: {
      payments: FeePaymentRecord[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }>(`/admin/payments${queryString(params)}`, { auth: true });
}

export function fetchAdminPaymentStats() {
  return apiRequest<{
    success: boolean;
    data: {
      totalAssigned: number;
      totalCollected: number;
      totalPending: number;
      overdueAmount: number;
      paymentCount: number;
      latestPayments: FeePaymentRecord[];
    };
  }>("/admin/payments/stats", { auth: true });
}

export function recordOfflineFeePayment(body: {
  feePlanId: string;
  amount: number;
  provider: "CASH" | "BANK_TRANSFER" | "UPI_MANUAL";
  paymentMethod?: string;
  note?: string;
  paidAt?: string;
}) {
  return apiRequest<{ success: boolean; data: FeePaymentRecord }>("/admin/payments/offline", {
    method: "POST",
    body,
    auth: true,
  });
}

export function fetchAdminPaymentReceipt(paymentId: string) {
  return apiRequest<{ success: boolean; data: PaymentReceipt }>(
    `/admin/payments/${paymentId}/receipt`,
    { auth: true },
  );
}
