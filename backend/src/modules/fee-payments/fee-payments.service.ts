import crypto from "node:crypto";
import type { FeePaymentStatus, Prisma } from "@lms/database";
import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import { logAudit } from "../audit/audit.service.js";
import { getRazorpayClient, getRazorpayKeyId } from "../payments/razorpay.client.js";
import { syncFeeAmounts } from "../fees/fees.service.js";
import {
  buildReceiptPayload,
  mapFeePayment,
  toNumber,
  toPaise,
} from "./fee-payments.helpers.js";
import type { CreateOrderInput, OfflinePaymentInput, VerifyPaymentInput } from "./fee-payments.validation.js";

const paymentInclude = {
  student: { select: { id: true, firstName: true, lastName: true, email: true } },
  feePlan: {
    select: {
      id: true,
      title: true,
      course: { select: { id: true, title: true, slug: true } },
      batch: { select: { id: true, name: true } },
    },
  },
  recordedBy: { select: { firstName: true, lastName: true } },
} as const;

export async function assertStudentOwnsFeePlan(studentId: string, feePlanId: string) {
  const plan = await prisma.feePlan.findUnique({
    where: { id: feePlanId },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
      batch: { select: { id: true, name: true } },
    },
  });
  if (!plan) throw ApiError.notFound("Fee plan not found");
  if (plan.studentId !== studentId) throw ApiError.forbidden("You cannot access this fee plan");
  if (plan.status === "CANCELLED") throw ApiError.badRequest("This fee plan has been cancelled");
  return plan;
}

async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
    const receipt = `CX${year}${suffix}`;
    const exists = await prisma.feePayment.findUnique({ where: { receiptNumber: receipt } });
    if (!exists) return receipt;
  }
  throw ApiError.internal("Could not generate receipt number");
}

function validatePayAmount(
  plan: { pendingAmount: Parameters<typeof toNumber>[0]; allowPartialPayments: boolean },
  amount: number,
) {
  const pending = toNumber(plan.pendingAmount);
  if (pending <= 0) throw ApiError.badRequest("No pending amount on this fee plan");
  if (amount <= 0) throw ApiError.badRequest("Amount must be greater than zero");
  if (amount > pending + 0.01) throw ApiError.badRequest("Amount exceeds pending balance");
  if (!plan.allowPartialPayments && Math.abs(amount - pending) > 0.01) {
    throw ApiError.badRequest("Full payment is required for this fee plan");
  }
}

export async function createFeePaymentOrder(
  studentId: string,
  feePlanId: string,
  input: CreateOrderInput,
) {
  const plan = await assertStudentOwnsFeePlan(studentId, feePlanId);
  validatePayAmount(plan, input.amount);

  const openAttempt = await prisma.paymentAttempt.findFirst({
    where: {
      feePlanId,
      studentId,
      amount: input.amount,
      status: { in: ["CREATED", "ATTEMPTED", "AUTHORIZED"] },
      createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (openAttempt) {
    return {
      razorpayKeyId: getRazorpayKeyId(),
      orderId: openAttempt.razorpayOrderId,
      amount: toPaise(input.amount),
      currency: openAttempt.currency,
      feeTitle: plan.title,
      student: {
        name: `${plan.student.firstName} ${plan.student.lastName}`.trim(),
        email: plan.student.email,
      },
    };
  }

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: toPaise(input.amount),
    currency: plan.currency || "INR",
    receipt: `fee_${feePlanId.slice(-8)}_${Date.now()}`,
    notes: { feePlanId, studentId, type: "institute_fee" },
  });

  await prisma.paymentAttempt.create({
    data: {
      feePlanId,
      studentId,
      provider: "RAZORPAY",
      amount: input.amount,
      currency: plan.currency || "INR",
      status: "CREATED",
      razorpayOrderId: order.id,
    },
  });

  return {
    razorpayKeyId: getRazorpayKeyId(),
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    feeTitle: plan.title,
    student: {
      name: `${plan.student.firstName} ${plan.student.lastName}`.trim(),
      email: plan.student.email,
    },
  };
}

async function captureFeePayment(params: {
  studentId: string;
  feePlanId: string;
  amount: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentMethod?: string | null;
  actorId?: string;
  actorRole?: string;
}) {
  const existing = await prisma.feePayment.findUnique({
    where: { razorpayPaymentId: params.razorpayPaymentId },
    include: paymentInclude,
  });
  if (existing?.status === "CAPTURED") {
    return mapFeePayment(existing);
  }

  const attempt = await prisma.paymentAttempt.findUnique({
    where: { razorpayOrderId: params.razorpayOrderId },
  });
  if (!attempt) throw ApiError.notFound("Payment attempt not found");
  if (attempt.studentId !== params.studentId) throw ApiError.forbidden();
  if (attempt.feePlanId !== params.feePlanId) throw ApiError.badRequest("Fee plan mismatch");

  const receiptNumber = await generateReceiptNumber();
  const payment = await prisma.$transaction(async (tx) => {
    const dup = await tx.feePayment.findUnique({
      where: { razorpayPaymentId: params.razorpayPaymentId },
    });
    if (dup?.status === "CAPTURED") return dup;

    const created = await tx.feePayment.create({
      data: {
        feePlanId: params.feePlanId,
        studentId: params.studentId,
        amount: params.amount,
        currency: attempt.currency,
        provider: "RAZORPAY",
        status: "CAPTURED",
        razorpayOrderId: params.razorpayOrderId,
        razorpayPaymentId: params.razorpayPaymentId,
        razorpaySignature: params.razorpaySignature,
        paymentMethod: params.paymentMethod ?? undefined,
        receiptNumber,
        paidAt: new Date(),
      },
      include: paymentInclude,
    });

    await tx.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "CAPTURED",
        razorpayPaymentId: params.razorpayPaymentId,
      },
    });

    return created;
  });

  await syncFeeAmounts(params.feePlanId);

  await logAudit({
    actorId: params.actorId ?? params.studentId,
    action: "PAYMENT_CAPTURED",
    entityType: "FeePayment",
    entityId: payment.id,
    metadata: {
      feePlanId: params.feePlanId,
      amount: params.amount,
      razorpayPaymentId: params.razorpayPaymentId,
      receiptNumber: payment.receiptNumber,
    },
  });

  return mapFeePayment(payment);
}

export async function verifyFeePayment(studentId: string, input: VerifyPaymentInput) {
  await assertStudentOwnsFeePlan(studentId, input.feePlanId);
  validatePayAmount(
    await prisma.feePlan.findUniqueOrThrow({ where: { id: input.feePlanId } }),
    input.amount,
  );

  const body = `${input.razorpay_order_id}|${input.razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== input.razorpay_signature) {
    await prisma.paymentAttempt.updateMany({
      where: { razorpayOrderId: input.razorpay_order_id },
      data: { status: "FAILED", errorDescription: "Invalid signature" },
    });
    throw ApiError.badRequest("Invalid payment signature", "INVALID_SIGNATURE");
  }

  const attempt = await prisma.paymentAttempt.findUnique({
    where: { razorpayOrderId: input.razorpay_order_id },
  });
  if (!attempt) throw ApiError.notFound("Payment attempt not found");
  if (attempt.studentId !== studentId) throw ApiError.forbidden();
  if (Math.abs(toNumber(attempt.amount) - input.amount) > 0.01) {
    throw ApiError.badRequest("Payment amount mismatch", "AMOUNT_MISMATCH");
  }

  const razorpay = getRazorpayClient();
  const razorpayPayment = await razorpay.payments.fetch(input.razorpay_payment_id);

  if (razorpayPayment.order_id !== input.razorpay_order_id) {
    throw ApiError.badRequest("Payment does not match order", "PAYMENT_MISMATCH");
  }
  if (Number(razorpayPayment.amount) !== toPaise(input.amount)) {
    throw ApiError.badRequest("Payment amount mismatch", "AMOUNT_MISMATCH");
  }
  if (razorpayPayment.status !== "captured" && razorpayPayment.status !== "authorized") {
    throw ApiError.badRequest("Payment not completed", "PAYMENT_INCOMPLETE");
  }

  const payment = await captureFeePayment({
    studentId,
    feePlanId: input.feePlanId,
    amount: input.amount,
    razorpayOrderId: input.razorpay_order_id,
    razorpayPaymentId: input.razorpay_payment_id,
    razorpaySignature: input.razorpay_signature,
    paymentMethod: razorpayPayment.method ?? null,
  });

  return {
    message: "Payment verified successfully",
    payment,
    receiptNumber: payment.receiptNumber,
  };
}

export async function recordOfflinePayment(adminId: string, input: OfflinePaymentInput) {
  const plan = await prisma.feePlan.findUnique({ where: { id: input.feePlanId } });
  if (!plan) throw ApiError.notFound("Fee plan not found");
  if (plan.status === "CANCELLED") throw ApiError.badRequest("Fee plan is cancelled");

  validatePayAmount(plan, input.amount);

  const receiptNumber = await generateReceiptNumber();
  const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();

  const payment = await prisma.feePayment.create({
    data: {
      feePlanId: input.feePlanId,
      studentId: plan.studentId,
      amount: input.amount,
      currency: plan.currency,
      provider: input.provider,
      status: "CAPTURED",
      paymentMethod: input.paymentMethod,
      receiptNumber,
      paidAt,
      paymentDate: paidAt,
      paymentMode:
        input.provider === "UPI_MANUAL"
          ? "UPI"
          : input.provider === "BANK_TRANSFER"
            ? "BANK_TRANSFER"
            : "CASH",
      note: input.note,
      recordedById: adminId,
    },
    include: paymentInclude,
  });

  await syncFeeAmounts(input.feePlanId);

  await logAudit({
    actorId: adminId,
    action: "PAYMENT_CAPTURED",
    entityType: "FeePayment",
    entityId: payment.id,
    metadata: {
      feePlanId: input.feePlanId,
      amount: input.amount,
      provider: input.provider,
      offline: true,
      receiptNumber,
    },
  });

  return mapFeePayment(payment);
}

export async function listStudentFeePayments(studentId: string) {
  const payments = await prisma.feePayment.findMany({
    where: { studentId },
    include: paymentInclude,
    orderBy: { createdAt: "desc" },
  });
  return payments.map(mapFeePayment);
}

export async function listAdminFeePayments(query: {
  page?: number;
  limit?: number;
  studentId?: string;
  feePlanId?: string;
  status?: FeePaymentStatus;
  provider?: string;
  from?: string;
  to?: string;
}) {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.FeePaymentWhereInput = {};
  if (query.studentId) where.studentId = query.studentId;
  if (query.feePlanId) where.feePlanId = query.feePlanId;
  if (query.status) where.status = query.status;
  if (query.provider) where.provider = query.provider as never;
  if (query.from || query.to) {
    where.createdAt = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    };
  }

  const [rows, total] = await Promise.all([
    prisma.feePayment.findMany({
      where,
      skip,
      take: limit,
      include: paymentInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.feePayment.count({ where }),
  ]);

  return {
    payments: rows.map(mapFeePayment),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getPaymentStats() {
  const [plans, capturedPayments, recentPayments] = await Promise.all([
    prisma.feePlan.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { totalAmount: true, paidAmount: true, pendingAmount: true, status: true },
    }),
    prisma.feePayment.aggregate({
      where: { status: "CAPTURED" },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.feePayment.findMany({
      where: { status: "CAPTURED" },
      include: paymentInclude,
      orderBy: { paidAt: "desc" },
      take: 10,
    }),
  ]);

  let totalAssigned = 0;
  let totalPending = 0;
  let overdueAmount = 0;

  for (const p of plans) {
    totalAssigned += toNumber(p.totalAmount);
    totalPending += toNumber(p.pendingAmount);
    if (p.status === "OVERDUE") overdueAmount += toNumber(p.pendingAmount);
  }

  return {
    totalAssigned,
    totalCollected: toNumber(capturedPayments._sum.amount ?? 0),
    totalPending,
    overdueAmount,
    paymentCount: capturedPayments._count.id,
    latestPayments: recentPayments.map(mapFeePayment),
  };
}

export async function getPaymentReceipt(
  paymentId: string,
  requesterId: string,
  isAdmin: boolean,
) {
  const payment = await prisma.feePayment.findUnique({
    where: { id: paymentId },
    include: {
      ...paymentInclude,
      feePlan: {
        include: {
          student: { select: { firstName: true, lastName: true, email: true } },
          course: { select: { title: true } },
          batch: { select: { name: true } },
        },
      },
    },
  });

  if (!payment) throw ApiError.notFound("Payment not found");
  if (!isAdmin && payment.studentId !== requesterId) {
    throw ApiError.forbidden("You cannot view this receipt");
  }
  if (payment.status !== "CAPTURED") {
    throw ApiError.badRequest("Receipt is only available for captured payments");
  }

  const mapped = mapFeePayment(payment as Parameters<typeof mapFeePayment>[0]);
  return buildReceiptPayload(mapped, payment.feePlan);
}

export async function processRazorpayWebhook(payload: {
  event: string;
  payload: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        status?: string;
        method?: string;
        error_code?: string;
        error_description?: string;
        notes?: Record<string, string>;
      };
    };
    order?: { entity?: { id?: string; notes?: Record<string, string> } };
  };
}) {
  const event = payload.event;
  const paymentEntity = payload.payload.payment?.entity;
  const orderEntity = payload.payload.order?.entity;

  if (event === "payment.failed" && paymentEntity?.order_id) {
    await prisma.paymentAttempt.updateMany({
      where: { razorpayOrderId: paymentEntity.order_id },
      data: {
        status: "FAILED",
        razorpayPaymentId: paymentEntity.id ?? undefined,
        errorCode: paymentEntity.error_code ?? undefined,
        errorDescription: paymentEntity.error_description ?? undefined,
      },
    });
    await logAudit({
      action: "PAYMENT_FAILED",
      entityType: "PaymentAttempt",
      entityId: paymentEntity.order_id,
      metadata: { razorpayPaymentId: paymentEntity.id, reason: paymentEntity.error_description },
    });
    return { handled: true };
  }

  const orderId = paymentEntity?.order_id ?? orderEntity?.id;
  if (!orderId) return { handled: false };

  const notes = paymentEntity?.notes ?? orderEntity?.notes ?? {};
  if (notes.type !== "institute_fee") return { handled: false };

  const feePlanId = notes.feePlanId;
  const studentId = notes.studentId;
  if (!feePlanId || !studentId || !paymentEntity?.id) return { handled: false };

  if (paymentEntity.status === "captured" || event === "payment.captured" || event === "order.paid") {
    const attempt = await prisma.paymentAttempt.findUnique({ where: { razorpayOrderId: orderId } });
    if (!attempt) return { handled: false };

    const existing = await prisma.feePayment.findUnique({
      where: { razorpayPaymentId: paymentEntity.id },
    });
    if (existing?.status === "CAPTURED") return { handled: true, duplicate: true };

    const amount = toNumber(attempt.amount);
    const signature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentEntity.id}`)
      .digest("hex");

    await captureFeePayment({
      studentId,
      feePlanId,
      amount,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentEntity.id,
      razorpaySignature: signature,
      paymentMethod: paymentEntity.method ?? null,
    });
    return { handled: true };
  }

  return { handled: false };
}
