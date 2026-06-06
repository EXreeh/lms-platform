import type { FeeStatus, Prisma } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { computeFeeStatus, mapFeePlan, toNumber } from "./fees.helpers.js";
import * as messagesService from "../messages/messages.service.js";
import { logPrismaRouteError } from "../../utils/prisma-safe.js";

const EMPTY_FEE_ANALYTICS = {
  totalCollected: 0,
  totalPending: 0,
  overdueStudents: 0,
  planCount: 0,
};

const EMPTY_STUDENT_FEE_DASHBOARD = {
  totalFee: 0,
  paidFee: 0,
  pendingFee: 0,
  plans: [] as ReturnType<typeof mapFeePlan>[],
  reminders: [] as Array<{
    id: string;
    feePlanId: string;
    message: string;
    reminderDate: string;
    status: string;
  }>,
};

const feeInclude = {
  student: { select: { id: true, firstName: true, lastName: true, email: true } },
  course: { select: { id: true, title: true, slug: true } },
  batch: { select: { id: true, name: true } },
  payments: {
    orderBy: { paymentDate: "desc" as const },
    include: { recordedBy: { select: { firstName: true, lastName: true } } },
  },
} satisfies Prisma.FeePlanInclude;

async function syncFeeAmounts(planId: string) {
  const plan = await prisma.feePlan.findUnique({
    where: { id: planId },
    include: { payments: true },
  });
  if (!plan) {
    throw ApiError.notFound("Fee plan not found");
  }

  const paidSum = plan.payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
  const total = toNumber(plan.totalAmount);
  const pending = Math.max(0, total - paidSum);
  const status = computeFeeStatus(pending, paidSum, plan.dueDate);
  const fullyPaid = pending <= 0;

  let accessGranted = plan.accessGranted;
  let lifetimeAccess = plan.lifetimeAccess;

  if (fullyPaid) {
    accessGranted = true;
    lifetimeAccess = true;
    const { grantAccessFromFeePlan } = await import(
      "../course-access/course-access.service.js"
    );
    const assignerId = plan.payments[0]?.recordedById ?? plan.studentId;
    if (plan.courseId) {
      await grantAccessFromFeePlan(plan.studentId, plan.courseId, assignerId, true);
    }
    if (plan.batchId) {
      const batchCourses = await prisma.batchCourse.findMany({
        where: { batchId: plan.batchId },
        select: { courseId: true },
      });
      const legacy = await prisma.batch.findUnique({
        where: { id: plan.batchId },
        select: { courseId: true },
      });
      const courseIds = new Set(batchCourses.map((c) => c.courseId));
      if (legacy?.courseId) courseIds.add(legacy.courseId);
      for (const courseId of courseIds) {
        await grantAccessFromFeePlan(plan.studentId, courseId, assignerId, true);
      }
    }
  }

  return prisma.feePlan.update({
    where: { id: planId },
    data: {
      paidAmount: paidSum,
      pendingAmount: pending,
      status,
      accessGranted,
      lifetimeAccess,
    },
    include: feeInclude,
  });
}

export async function listFeePlans(filters: {
  status?: FeeStatus;
  studentId?: string;
  search?: string;
}) {
  const where: Prisma.FeePlanWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.studentId) where.studentId = filters.studentId;
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { student: { email: { contains: q, mode: "insensitive" } } },
      { student: { firstName: { contains: q, mode: "insensitive" } } },
      { student: { lastName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const plans = await prisma.feePlan.findMany({
    where,
    include: feeInclude,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  return plans.map((p) => mapFeePlan(p));
}

export async function getFeeAnalytics() {
  try {
    const plans = await prisma.feePlan.findMany({
      select: { totalAmount: true, paidAmount: true, pendingAmount: true, status: true },
    });

    let totalCollected = 0;
    let totalPending = 0;
    let overdueCount = 0;

    for (const p of plans) {
      totalCollected += toNumber(p.paidAmount);
      totalPending += toNumber(p.pendingAmount);
      if (p.status === "OVERDUE") overdueCount += 1;
    }

    return {
      totalCollected,
      totalPending,
      overdueStudents: overdueCount,
      planCount: plans.length,
    };
  } catch (error) {
    logPrismaRouteError("/api/dashboard/admin", error, "getFeeAnalytics");
    return EMPTY_FEE_ANALYTICS;
  }
}

export async function getFeePlanById(id: string) {
  const plan = await prisma.feePlan.findUnique({ where: { id }, include: feeInclude });
  if (!plan) throw ApiError.notFound("Fee plan not found");
  return mapFeePlan(plan);
}

export async function createFeePlan(
  input: {
    studentId: string;
    courseId?: string | null;
    batchId?: string | null;
    totalAmount: number;
    dueDate: string;
  },
) {
  const student = await prisma.user.findFirst({
    where: { id: input.studentId, role: "STUDENT", suspended: false },
  });
  if (!student) throw ApiError.badRequest("Student not found");

  const dueDate = new Date(input.dueDate);
  const plan = await prisma.feePlan.create({
    data: {
      studentId: input.studentId,
      courseId: input.courseId ?? null,
      batchId: input.batchId ?? null,
      totalAmount: input.totalAmount,
      paidAmount: 0,
      pendingAmount: input.totalAmount,
      dueDate,
      status: computeFeeStatus(input.totalAmount, 0, dueDate),
    },
    include: feeInclude,
  });

  return mapFeePlan(plan);
}

export async function addFeePayment(
  feePlanId: string,
  input: {
    amount: number;
    paymentMode: string;
    paymentDate?: string;
    note?: string;
  },
  recordedById: string,
) {
  const plan = await prisma.feePlan.findUnique({ where: { id: feePlanId } });
  if (!plan) throw ApiError.notFound("Fee plan not found");

  const pending = toNumber(plan.pendingAmount);
  if (input.amount > pending + 0.01) {
    throw ApiError.badRequest("Payment amount exceeds pending balance");
  }

  await prisma.feePayment.create({
    data: {
      feePlanId,
      amount: input.amount,
      paymentMode: input.paymentMode as never,
      paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
      note: input.note,
      recordedById,
    },
  });

  const updated = await syncFeeAmounts(feePlanId);
  return mapFeePlan(updated);
}

export async function sendFeeReminder(
  feePlanId: string,
  message: string,
  sentById: string,
) {
  const plan = await prisma.feePlan.findUnique({
    where: { id: feePlanId },
    include: { student: true },
  });
  if (!plan) throw ApiError.notFound("Fee plan not found");

  const reminder = await prisma.feeReminder.create({
    data: {
      studentId: plan.studentId,
      feePlanId,
      message,
      reminderDate: new Date(),
      status: "SENT",
      sentById,
    },
  });

  await messagesService.sendMessage({
    senderId: sentById,
    senderRole: "ADMIN",
    recipientIds: [plan.studentId],
    subject: "Fee payment reminder",
    content: message,
    type: "FEE_REMINDER",
    feePlanId,
  });

  return {
    id: reminder.id,
    message: reminder.message,
    reminderDate: reminder.reminderDate.toISOString(),
    status: reminder.status,
  };
}

export async function getStudentFeeDashboard(studentId: string) {
  try {
    return await loadStudentFeeDashboard(studentId);
  } catch (error) {
    logPrismaRouteError("/api/dashboard/student", error, "getStudentFeeDashboard");
    return EMPTY_STUDENT_FEE_DASHBOARD;
  }
}

async function loadStudentFeeDashboard(studentId: string) {
  const plans = await prisma.feePlan.findMany({
    where: { studentId },
    include: {
      ...feeInclude,
      reminders: { orderBy: { reminderDate: "desc" }, take: 10 },
    },
  });

  const reminders = await prisma.feeReminder.findMany({
    where: { studentId },
    orderBy: { reminderDate: "desc" },
    take: 20,
  });

  const analytics = plans.reduce(
    (acc, p) => {
      acc.totalFee += toNumber(p.totalAmount);
      acc.paidFee += toNumber(p.paidAmount);
      acc.pendingFee += toNumber(p.pendingAmount);
      return acc;
    },
    { totalFee: 0, paidFee: 0, pendingFee: 0 },
  );

  return {
    ...analytics,
    plans: plans.map((p) => mapFeePlan(p)),
    reminders: reminders.map((r) => ({
      id: r.id,
      feePlanId: r.feePlanId,
      message: r.message,
      reminderDate: r.reminderDate.toISOString(),
      status: r.status,
    })),
  };
}

export async function refreshOverdueStatuses() {
  try {
    const overdue = await prisma.feePlan.findMany({
      where: {
        pendingAmount: { gt: 0 },
        dueDate: { lt: new Date() },
        status: { not: "PAID" },
      },
    });

    await Promise.all(
      overdue.map((p) =>
        prisma.feePlan.update({
          where: { id: p.id },
          data: { status: "OVERDUE" },
        }),
      ),
    );
  } catch (error) {
    logPrismaRouteError("/api/dashboard/admin", error, "refreshOverdueStatuses");
  }
}
