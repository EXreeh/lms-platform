export type PaymentStatus = "CREATED" | "PENDING" | "CAPTURED" | "FAILED";

export interface Payment {
  id: string;
  studentId: string;
  courseId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  student?: { id: string; name: string; email: string };
  course?: { id: string; title: string; slug: string };
}

export interface PaymentOrderResponse {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  payment: Payment;
  course: { id: string; title: string; slug: string; price: number };
}

export interface PaymentVerifyResponse {
  message: string;
  payment: Payment;
  enrollment: { id: string; courseId: string; progressPercentage: number } | null;
  courseSlug: string;
  courseTitle: string;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  currency: string;
  totalTransactions: number;
  recentPayments: Payment[];
  courseRevenue: {
    courseId: string;
    course: { id: string; title: string; slug: string } | null;
    revenue: number;
    transactions: number;
  }[];
}

export function formatPaymentAmount(amount: number, currency = "INR"): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function isPaidCourse(price: number): boolean {
  return price > 0;
}
