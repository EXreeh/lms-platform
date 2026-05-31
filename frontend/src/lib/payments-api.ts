import type { Payment, PaymentOrderResponse, PaymentVerifyResponse, RevenueAnalytics } from "@/types/payment";
import { apiRequest } from "./api";

export function createPaymentOrder(courseId: string) {
  return apiRequest<{ success: boolean; data: PaymentOrderResponse }>("/payments/orders", {
    method: "POST",
    body: { courseId },
    auth: true,
  });
}

export function verifyPayment(body: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  return apiRequest<{ success: boolean; data: PaymentVerifyResponse }>("/payments/verify", {
    method: "POST",
    body,
    auth: true,
  });
}

export function fetchMyPayments() {
  return apiRequest<{ success: boolean; data: { payments: Payment[] } }>("/payments/mine", {
    auth: true,
  });
}

export function fetchRevenueAnalytics() {
  return apiRequest<{ success: boolean; data: { analytics: RevenueAnalytics } }>(
    "/payments/admin/analytics",
    { auth: true },
  );
}

export function fetchAllPayments() {
  return apiRequest<{ success: boolean; data: { payments: Payment[] } }>("/payments/admin/all", {
    auth: true,
  });
}
