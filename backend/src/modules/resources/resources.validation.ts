import { z } from "zod";

export const resourceTypeEnum = z.enum(["PDF", "NOTE", "LINK", "ASSIGNMENT", "OTHER"]);

export const createResourceSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  type: resourceTypeEnum,
  url: z.string().url("Resource URL must be valid"),
  fileName: z.string().max(255).optional(),
  courseId: z.string().min(1, "Course is required"),
  lessonId: z
    .preprocess(
      (val) => (val === "" || val === undefined ? null : val),
      z.union([z.string().min(1), z.null()]).optional(),
    ),
});

export const updateResourceSchema = createResourceSchema
  .partial()
  .omit({ courseId: true, lessonId: true });

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
