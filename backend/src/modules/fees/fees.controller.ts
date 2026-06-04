import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import * as feesService from "./fees.service.js";
import {
  addFeePaymentSchema,
  createFeePlanSchema,
  feeListQuerySchema,
  sendFeeReminderSchema,
} from "./fees.validation.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export async function listAdmin(req: Request, res: Response): Promise<void> {
  requireUser(req);
  await feesService.refreshOverdueStatuses();
  const query = feeListQuerySchema.parse(req.query);
  const data = await feesService.listFeePlans(query);
  res.json({ success: true, data });
}

export async function analytics(req: Request, res: Response): Promise<void> {
  requireUser(req);
  await feesService.refreshOverdueStatuses();
  const data = await feesService.getFeeAnalytics();
  res.json({ success: true, data });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const data = await feesService.getFeePlanById(req.params.feePlanId);
  res.json({ success: true, data });
}

export async function create(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const body = createFeePlanSchema.parse(req.body);
  const data = await feesService.createFeePlan(body);
  res.status(201).json({ success: true, data });
}

export async function addPayment(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const body = addFeePaymentSchema.parse(req.body);
  const data = await feesService.addFeePayment(req.params.feePlanId, body, user.id);
  res.json({ success: true, data });
}

export async function sendReminder(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const { message } = sendFeeReminderSchema.parse(req.body);
  const data = await feesService.sendFeeReminder(req.params.feePlanId, message, user.id);
  res.json({ success: true, data });
}

export async function studentDashboard(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  await feesService.refreshOverdueStatuses();
  const data = await feesService.getStudentFeeDashboard(user.id);
  res.json({ success: true, data });
}

export async function studentAccess(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const studentId = req.params.studentId;

  if (user.role === "STUDENT" && user.id !== studentId) {
    throw ApiError.forbidden("Access denied");
  }

  if (user.role === "TEACHER") {
    const { prisma } = await import("../../config/database.js");
    const membership = await prisma.batchStudent.findFirst({
      where: { studentId, batch: { teacherId: user.id } },
    });
    if (!membership) throw ApiError.forbidden("Student not in your batch");
  }

  const dashboard = await feesService.getStudentFeeDashboard(studentId);
  const hasPending = dashboard.pendingFee > 0;
  const lifetime = dashboard.plans.some((p) => p.lifetimeAccess);
  const granted = dashboard.plans.some((p) => p.accessGranted) || !hasPending;

  res.json({
    success: true,
    data: {
      accessLabel: lifetime
        ? "Lifetime access granted"
        : granted
          ? "Active"
          : "Pending fee",
      lifetimeAccess: lifetime,
      accessGranted: granted,
      pendingFee: dashboard.pendingFee,
    },
  });
}
