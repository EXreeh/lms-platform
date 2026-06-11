import { z } from "zod";

export const createOrderSchema = z.object({
  amount: z.coerce.number().positive(),
});

export const verifyPaymentSchema = z.object({
  feePlanId: z.string().min(1),
  amount: z.coerce.number().positive(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const offlinePaymentSchema = z.object({
  feePlanId: z.string().min(1),
  amount: z.coerce.number().positive(),
  provider: z.enum(["CASH", "BANK_TRANSFER", "UPI_MANUAL"]),
  paymentMethod: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
  paidAt: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
});

export const updateFeePlanSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  totalAmount: z.coerce.number().positive().optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  allowPartialPayments: z.boolean().optional(),
  status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).optional(),
});

export const adminFeeListQuerySchema = z.object({
  status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  studentId: z.string().optional(),
  batchId: z.string().optional(),
  courseId: z.string().optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const adminPaymentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  studentId: z.string().optional(),
  feePlanId: z.string().optional(),
  status: z
    .enum(["CREATED", "ATTEMPTED", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED", "CANCELLED"])
    .optional(),
  provider: z.enum(["RAZORPAY", "CASH", "BANK_TRANSFER", "UPI_MANUAL"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type OfflinePaymentInput = z.infer<typeof offlinePaymentSchema>;
export type UpdateFeePlanInput = z.infer<typeof updateFeePlanSchema>;
