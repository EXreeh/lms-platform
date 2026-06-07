import { z } from "zod";

export const createBatchSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  courseId: z.string().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  studentIds: z.array(z.string()).optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().date()),
  endDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  timing: z.string().max(120).optional(),
  daysOfWeek: z.string().max(120).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED", "DELETED"]).optional(),
});

export const updateBatchSchema = createBatchSchema.partial().extend({
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED", "DELETED"]).optional(),
});

export const batchStudentsSchema = z.object({
  studentIds: z.array(z.string()).min(1),
});

export const batchListQuerySchema = z.object({
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED", "DELETED"]).optional(),
  search: z.string().optional(),
  teacherId: z.string().optional(),
  includeDeleted: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});
