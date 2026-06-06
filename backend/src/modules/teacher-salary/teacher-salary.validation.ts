import { z } from "zod";

export const salaryListQuerySchema = z.object({
  teacherId: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  status: z.enum(["PENDING", "PAID", "HOLD"]).optional(),
});

export const createSalarySchema = z.object({
  teacherId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  baseSalary: z.number().nonnegative(),
  bonus: z.number().nonnegative().optional(),
  deductions: z.number().nonnegative().optional(),
  note: z.string().max(2000).optional(),
});

export const updateSalarySchema = z.object({
  baseSalary: z.number().nonnegative().optional(),
  bonus: z.number().nonnegative().optional(),
  deductions: z.number().nonnegative().optional(),
  status: z.enum(["PENDING", "PAID", "HOLD"]).optional(),
  note: z.string().max(2000).optional().nullable(),
});
