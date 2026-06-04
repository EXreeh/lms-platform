import type { FeeAnalytics, FeePlan, StudentFeeDashboard } from "@/types/institute";
import { apiRequest } from "./api";

function queryString(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function fetchFeePlans(params?: { status?: string; search?: string }) {
  return apiRequest<{ success: boolean; data: FeePlan[] }>(
    `/fees${queryString(params ?? {})}`,
    { auth: true },
  );
}

export function fetchFeeAnalytics() {
  return apiRequest<{ success: boolean; data: FeeAnalytics }>("/fees/analytics", {
    auth: true,
  });
}

export function fetchFeePlan(feePlanId: string) {
  return apiRequest<{ success: boolean; data: FeePlan }>(`/fees/${feePlanId}`, {
    auth: true,
  });
}

export function createFeePlan(body: {
  studentId: string;
  courseId?: string | null;
  batchId?: string | null;
  totalAmount: number;
  dueDate: string;
}) {
  return apiRequest<{ success: boolean; data: FeePlan }>("/fees", {
    method: "POST",
    body,
    auth: true,
  });
}

export function addFeePayment(
  feePlanId: string,
  body: { amount: number; paymentMode: string; paymentDate?: string; note?: string },
) {
  return apiRequest<{ success: boolean; data: FeePlan }>(`/fees/${feePlanId}/payments`, {
    method: "POST",
    body,
    auth: true,
  });
}

export function sendFeeReminder(feePlanId: string, message: string) {
  return apiRequest<{ success: boolean; data: unknown }>(`/fees/${feePlanId}/reminders`, {
    method: "POST",
    body: { message },
    auth: true,
  });
}

export function fetchStudentFees() {
  return apiRequest<{ success: boolean; data: StudentFeeDashboard }>("/fees/me", {
    auth: true,
  });
}
