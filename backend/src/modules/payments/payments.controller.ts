import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import * as paymentsService from "./payments.service.js";
import type { CreateOrderInput, VerifyPaymentInput } from "./payments.validation.js";

function requireStudent(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.role !== "STUDENT") {
    throw ApiError.forbidden("Only students can purchase courses");
  }
  return req.user;
}

function requireAdmin(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.role !== "ADMIN") throw ApiError.forbidden();
  return req.user;
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  const user = requireStudent(req);
  const data = await paymentsService.createPaymentOrder(user.id, req.body as CreateOrderInput);
  res.status(201).json({ success: true, data });
}

export async function verify(req: Request, res: Response): Promise<void> {
  const user = requireStudent(req);
  const result = await paymentsService.verifyPayment(user.id, req.body as VerifyPaymentInput);
  res.json({ success: true, data: result });
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const user = requireStudent(req);
  const payments = await paymentsService.listStudentPayments(user.id);
  res.json({ success: true, data: { payments } });
}

export async function revenueAnalytics(_req: Request, res: Response): Promise<void> {
  requireAdmin(_req);
  const analytics = await paymentsService.getRevenueAnalytics();
  res.json({ success: true, data: { analytics } });
}

export async function listAll(_req: Request, res: Response): Promise<void> {
  requireAdmin(_req);
  const payments = await paymentsService.listAllPayments();
  res.json({ success: true, data: { payments } });
}

export async function getKey(_req: Request, res: Response): Promise<void> {
  const { getRazorpayKeyId } = await import("./razorpay.client.js");
  res.json({ success: true, data: { keyId: getRazorpayKeyId() } });
}
