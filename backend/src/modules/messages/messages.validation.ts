import { z } from "zod";

const messageType = z.enum([
  "GENERAL",
  "FEE_REMINDER",
  "CLASS_UPDATE",
  "ASSIGNMENT",
  "ANNOUNCEMENT",
]);

export const sendMessageSchema = z
  .object({
    recipientIds: z.array(z.string()).optional(),
    batchId: z.string().optional(),
    broadcastAllStudents: z.boolean().optional(),
    subject: z.string().min(1).max(200),
    content: z.string().min(1).max(5000),
    type: messageType.optional(),
  })
  .refine(
    (data) =>
      (data.recipientIds?.length ?? 0) > 0 ||
      data.batchId ||
      data.broadcastAllStudents,
    { message: "Specify recipients, a batch, or broadcast to all students" },
  );

export const inboxQuerySchema = z.object({
  unreadOnly: z.enum(["true", "false"]).optional(),
});
