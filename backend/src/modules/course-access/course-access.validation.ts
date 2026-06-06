import { z } from "zod";

const accessType = z.enum(["ADMIN_ASSIGNED", "BATCH_ASSIGNED", "FULL_FEE_PAID", "TRIAL"]);

export const assignStudentCourseSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  accessType: accessType.optional(),
  lifetimeAccess: z.boolean().optional(),
  expiresAt: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
});

export const assignBatchCourseSchema = z.object({
  courseId: z.string().min(1),
});

export const revokeAccessSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
});

export const accessListQuerySchema = z.object({
  studentId: z.string().optional(),
  courseId: z.string().optional(),
});
