import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import { isAdminRole } from "../../utils/roles.js";
import * as feesService from "../fees/fees.service.js";
import * as feePaymentsService from "./fee-payments.service.js";
import {
  adminFeeListQuerySchema,
  adminPaymentListQuerySchema,
  offlinePaymentSchema,
  updateFeePlanSchema,
} from "./fee-payments.validation.js";
import { createFeePlanSchema } from "../fees/fees.validation.js";

function requireAdmin(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  if (!isAdminRole(req.user.role)) throw ApiError.forbidden("Admin access required");
  return req.user;
}

export async function listFees(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  await feesService.refreshOverdueStatuses();
  const query = adminFeeListQuerySchema.parse(req.query);
  const data = await feesService.listFeePlans(query);
  res.json({ success: true, data });
}

export async function createFee(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const body = createFeePlanSchema.parse(req.body);
  const data = await feesService.createFeePlan({ ...body, createdById: admin.id });
  res.status(201).json({ success: true, data });
}

export async function updateFee(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const body = updateFeePlanSchema.parse(req.body);
  const data = await feesService.updateFeePlan(req.params.id, body);
  res.json({ success: true, data });
}

export async function cancelFee(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const data = await feesService.cancelFeePlan(req.params.id);
  res.json({ success: true, data });
}

export async function listPayments(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const query = adminPaymentListQuerySchema.parse(req.query);
  const data = await feePaymentsService.listAdminFeePayments(query);
  res.json({ success: true, data });
}

export async function recordOffline(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const body = offlinePaymentSchema.parse(req.body);
  const data = await feePaymentsService.recordOfflinePayment(admin.id, body);
  res.status(201).json({ success: true, data });
}

export async function paymentStats(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const data = await feePaymentsService.getPaymentStats();
  res.json({ success: true, data });
}

export async function getReceipt(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const data = await feePaymentsService.getPaymentReceipt(req.params.paymentId, admin.id, true);
  res.json({ success: true, data });
}
