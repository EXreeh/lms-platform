import { z } from "zod";

export const createLiveClassSchema = z.object({
  batchId: z.string().min(1),
  teacherId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime({ offset: true }).or(z.string().date()),
  duration: z.coerce.number().int().min(15).max(480).optional(),
});

export const liveClassListQuerySchema = z.object({
  batchId: z.string().optional(),
  upcoming: z.enum(["true", "false"]).optional(),
});
