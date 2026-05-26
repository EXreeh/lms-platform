import { z } from "zod";

export const watchProgressSchema = z.object({
  watchedDuration: z.coerce.number().int().min(0),
});

export type WatchProgressInput = z.infer<typeof watchProgressSchema>;
