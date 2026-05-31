import crypto from "node:crypto";
import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import { logActivity } from "../admin/activity.service.js";
import { mapEnrollment } from "../learning/learning.mapper.js";
import { logAction } from "../../utils/logger.js";
import { getRazorpayClient, getRazorpayKeyId } from "./razorpay.client.js";
import { mapPayment, type MappedPayment, type PaymentWithRelations } from "./payments.mapper.js";
import type { CreateOrderInput, VerifyPaymentInput } from "./payments.validation.js";

const paymentInclude = {
  student: { select: { id: true, firstName: true, lastName: true, email: true } },
  course: { select: { id: true, title: true, slug: true } },
} as const;

function courseAmount(price: { toString(): string } | number): number {
  return Number(price);
}

export function isFreeCourse(price: { toString(): string } | number): boolean {
  return courseAmount(price) <= 0;
}

function toPaise(amount: number): number {
  return Math.round(amount * 100);
}

async function getPublishedCourseForPayment(courseId: string) {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      status: "APPROVED",
      deleteStatus: "ACTIVE",
    },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  if (!course) throw ApiError.notFound("Course not found or not available for purchase");
  return course;
}

async function createEnrollmentFromPayment(studentId: string, courseId: string) {
  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (existing) {
    return existing;
  }

  const enrollment = await prisma.enrollment.create({
    data: { studentId, courseId, progressPercentage: 0, completed: false },
  });

  const [student, course] = await Promise.all([
    prisma.user.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true },
    }),
    prisma.course.findUnique({ where: { id: courseId }, select: { title: true } }),
  ]);

  await logActivity({
    type: "ENROLLMENT",
    userId: studentId,
    courseId,
    metadata: {
      title: course?.title,
      userName: student ? `${student.firstName} ${student.lastName}`.trim() : undefined,
      viaPayment: true,
    },
  });

  return enrollment;
}

export async function createPaymentOrder(studentId: string, input: CreateOrderInput): Promise<{
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  payment: MappedPayment;
  course: { id: string; title: string; slug: string; price: number };
}> {
  const course = await getPublishedCourseForPayment(input.courseId);
  const amount = courseAmount(course.price);

  if (isFreeCourse(amount)) {
    throw ApiError.badRequest("This course is free — enroll directly without payment", "FREE_COURSE");
  }

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: course.id } },
  });
  if (existingEnrollment) {
    throw ApiError.conflict("Already enrolled in this course", "ALREADY_ENROLLED");
  }

  const capturedPayment = await prisma.payment.findFirst({
    where: { studentId, courseId: course.id, status: "CAPTURED" },
  });
  if (capturedPayment) {
    throw ApiError.conflict("Payment already completed for this course", "ALREADY_PAID");
  }

  const pending = await prisma.payment.findFirst({
    where: {
      studentId,
      courseId: course.id,
      status: { in: ["CREATED", "PENDING"] },
    },
    orderBy: { createdAt: "desc" },
    include: paymentInclude,
  });

  if (pending) {
    return {
      keyId: getRazorpayKeyId(),
      orderId: pending.razorpayOrderId,
      amount: toPaise(Number(pending.amount)),
      currency: pending.currency,
      payment: mapPayment(pending as PaymentWithRelations),
      course: { id: course.id, title: course.title, slug: course.slug, price: amount },
    };
  }

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: toPaise(amount),
    currency: "INR",
    receipt: `cx_${course.id.slice(-8)}_${Date.now()}`,
    notes: { courseId: course.id, studentId },
  });

  const payment = await prisma.payment.create({
    data: {
      studentId,
      courseId: course.id,
      amount,
      currency: "INR",
      razorpayOrderId: order.id,
      status: "CREATED",
    },
    include: paymentInclude,
  });

  logAction("[Payment] order created", { studentId, courseId: course.id, orderId: order.id });

  return {
    keyId: getRazorpayKeyId(),
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    payment: mapPayment(payment as PaymentWithRelations),
    course: { id: course.id, title: course.title, slug: course.slug, price: amount },
  };
}

export async function verifyPayment(studentId: string, input: VerifyPaymentInput): Promise<{
  message: string;
  payment: MappedPayment;
  enrollment: ReturnType<typeof mapEnrollment> | null;
  courseSlug: string;
  courseTitle: string;
}> {
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: input.razorpayOrderId },
    include: {
      ...paymentInclude,
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          status: true,
          deleteStatus: true,
          teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
          modules: true,
        },
      },
    },
  });

  if (!payment) throw ApiError.notFound("Payment order not found");
  if (payment.studentId !== studentId) throw ApiError.forbidden();

  if (payment.status === "CAPTURED") {
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: payment.courseId } },
    });
    return {
      message: "Payment already verified",
      payment: mapPayment(payment as PaymentWithRelations),
      enrollment: enrollment ? mapEnrollment(enrollment) : null,
      courseSlug: payment.course.slug,
      courseTitle: payment.course.title,
    };
  }

  const body = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== input.razorpaySignature) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    throw ApiError.badRequest("Invalid payment signature", "INVALID_SIGNATURE");
  }

  const serverAmount = toPaise(Number(payment.amount));
  const razorpay = getRazorpayClient();
  const razorpayPayment = await razorpay.payments.fetch(input.razorpayPaymentId);

  if (razorpayPayment.order_id !== input.razorpayOrderId) {
    throw ApiError.badRequest("Payment does not match order", "PAYMENT_MISMATCH");
  }
  if (Number(razorpayPayment.amount) !== serverAmount) {
    throw ApiError.badRequest("Payment amount mismatch", "AMOUNT_MISMATCH");
  }
  if (razorpayPayment.status !== "captured" && razorpayPayment.status !== "authorized") {
    throw ApiError.badRequest("Payment not completed", "PAYMENT_INCOMPLETE");
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature,
      status: "CAPTURED",
    },
    include: paymentInclude,
  });

  const enrollment = await createEnrollmentFromPayment(studentId, payment.courseId);

  await logActivity({
    type: "PAYMENT_COMPLETED",
    userId: studentId,
    courseId: payment.courseId,
    metadata: {
      paymentId: updated.id,
      amount: Number(updated.amount),
      currency: updated.currency,
      courseTitle: payment.course.title,
    },
  });

  logAction("[Payment] verified", {
    studentId,
    courseId: payment.courseId,
    paymentId: updated.id,
  });

  const courseForResponse = await prisma.course.findUnique({
    where: { id: payment.courseId },
    select: { slug: true, title: true },
  });

  return {
    message: "Payment verified and enrollment complete",
    payment: mapPayment(updated as PaymentWithRelations),
    enrollment: mapEnrollment(enrollment),
    courseSlug: courseForResponse?.slug ?? payment.course.slug,
    courseTitle: courseForResponse?.title ?? payment.course.title,
  };
}

export async function listStudentPayments(studentId: string): Promise<MappedPayment[]> {
  const payments = await prisma.payment.findMany({
    where: { studentId },
    include: paymentInclude,
    orderBy: { createdAt: "desc" },
  });
  return payments.map((p) => mapPayment(p as PaymentWithRelations));
}

export async function getRevenueAnalytics(): Promise<{
  totalRevenue: number;
  currency: string;
  totalTransactions: number;
  recentPayments: MappedPayment[];
  courseRevenue: {
    courseId: string;
    course: { id: string; title: string; slug: string } | null;
    revenue: number;
    transactions: number;
  }[];
}> {
  const [totalRevenueAgg, recentPayments, courseRevenue, paymentCount] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "CAPTURED" },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: { status: "CAPTURED" },
      include: paymentInclude,
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.payment.groupBy({
      by: ["courseId"],
      where: { status: "CAPTURED" },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.payment.count({ where: { status: "CAPTURED" } }),
  ]);

  const courseIds = courseRevenue.map((c) => c.courseId);
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, title: true, slug: true },
  });
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  return {
    totalRevenue: Number(totalRevenueAgg._sum.amount ?? 0),
    currency: "INR",
    totalTransactions: paymentCount,
    recentPayments: recentPayments.map((p) => mapPayment(p as PaymentWithRelations)),
    courseRevenue: courseRevenue
      .map((row) => ({
        courseId: row.courseId,
        course: courseMap.get(row.courseId) ?? null,
        revenue: Number(row._sum.amount ?? 0),
        transactions: row._count.id,
      }))
      .sort((a, b) => b.revenue - a.revenue),
  };
}

export async function listAllPayments(limit = 50): Promise<MappedPayment[]> {
  const payments = await prisma.payment.findMany({
    include: paymentInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return payments.map((p) => mapPayment(p as PaymentWithRelations));
}

export async function assertPaidEnrollment(studentId: string, courseId: string, price: number) {
  if (isFreeCourse(price)) return;
  const paid = await prisma.payment.findFirst({
    where: { studentId, courseId, status: "CAPTURED" },
  });
  if (!paid) {
    throw ApiError.badRequest(
      "Payment is required before enrolling in this course",
      "PAYMENT_REQUIRED",
    );
  }
}
