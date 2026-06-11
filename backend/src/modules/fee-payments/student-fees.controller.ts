import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import * as feesService from "../fees/fees.service.js";
import * as feePaymentsService from "./fee-payments.service.js";
import { getMinInstallmentAmount } from "./fee-payments.helpers.js";
import { createOrderSchema, verifyPaymentSchema } from "./fee-payments.validation.js";

function requireStudent(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.role !== "STUDENT") throw ApiError.forbidden("Student access required");
  return req.user;
}

export async function listFees(req: Request, res: Response): Promise<void> {
  const user = requireStudent(req);
  await feesService.refreshOverdueStatuses();
  const data = await feesService.getStudentFeeDashboard(user.id);
  res.json({
    success: true,
    data: { ...data, minInstallmentAmount: getMinInstallmentAmount() },
  });
}

export async function getFee(req: Request, res: Response): Promise<void> {
  const user = requireStudent(req);
  await feePaymentsService.assertStudentOwnsFeePlan(user.id, req.params.feePlanId);
  const data = await feesService.getFeePlanById(req.params.feePlanId);
  res.json({ success: true, data });
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  const user = requireStudent(req);
  const body = createOrderSchema.parse(req.body);
  const data = await feePaymentsService.createFeePaymentOrder(
    user.id,
    req.params.feePlanId,
    body,
  );
  res.json({ success: true, data });
}

export async function verifyPayment(req: Request, res: Response): Promise<void> {
  const user = requireStudent(req);
  const body = verifyPaymentSchema.parse(req.body);
  const data = await feePaymentsService.verifyFeePayment(user.id, body);
  res.json({ success: true, data });
}

export async function listPayments(req: Request, res: Response): Promise<void> {
  const user = requireStudent(req);
  const data = await feePaymentsService.listStudentFeePayments(user.id);
  res.json({ success: true, data });
}

export async function getReceipt(req: Request, res: Response): Promise<void> {
  const user = requireStudent(req);
  const data = await feePaymentsService.getPaymentReceipt(req.params.paymentId, user.id, false);
  res.json({ success: true, data });
}
