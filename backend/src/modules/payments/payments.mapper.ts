import type { Course, Payment, PaymentStatus, User } from "@lms/database";

export type PaymentWithRelations = Payment & {
  student: Pick<User, "id" | "firstName" | "lastName" | "email">;
  course: Pick<Course, "id" | "title" | "slug">;
};

export interface MappedPayment {
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
  student: { id: string; name: string; email: string };
  course: Pick<Course, "id" | "title" | "slug">;
}

export function mapPayment(payment: PaymentWithRelations): MappedPayment {
  return {
    id: payment.id,
    studentId: payment.studentId,
    courseId: payment.courseId,
    amount: Number(payment.amount),
    currency: payment.currency,
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    status: payment.status,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    student: {
      id: payment.student.id,
      name: `${payment.student.firstName} ${payment.student.lastName}`.trim(),
      email: payment.student.email,
    },
    course: payment.course,
  };
}
