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
    broadcastAllTeachers: z.boolean().optional(),
    subject: z.string().min(1).max(200),
    content: z.string().min(1).max(5000),
    type: messageType.optional(),
  })
  .refine(
    (data) =>
      (data.recipientIds?.length ?? 0) > 0 ||
      data.batchId ||
      data.broadcastAllStudents ||
      data.broadcastAllTeachers,
    {
      message:
        "Specify recipients, a batch, broadcast to all students, or broadcast to all teachers",
    },
  );

export const composeTargetsQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]).optional(),
});

export const inboxQuerySchema = z.object({
  unreadOnly: z.enum(["true", "false"]).optional(),
});
