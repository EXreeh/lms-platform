import { z } from "zod";

const paymentMode = z.enum(["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"]);

export const createFeePlanSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().optional().nullable(),
  batchId: z.string().optional().nullable(),
  totalAmount: z.coerce.number().positive(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()),
});

export const addFeePaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  paymentMode,
  paymentDate: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  note: z.string().max(500).optional(),
});

export const sendFeeReminderSchema = z.object({
  message: z.string().min(1).max(2000),
});

export const feeListQuerySchema = z.object({
  status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE"]).optional(),
  studentId: z.string().optional(),
  search: z.string().optional(),
});
