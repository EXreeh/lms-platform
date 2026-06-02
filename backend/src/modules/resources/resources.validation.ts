import { z } from "zod";
import { urlOrUploadPath } from "../courses/courses.validation.js";

export const resourceTypeEnum = z.enum(["PDF", "NOTE", "LINK", "ASSIGNMENT", "OTHER"]);

export const createResourceSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  type: resourceTypeEnum,
  url: urlOrUploadPath.refine((v) => v.length > 0, "Resource URL or uploaded file is required"),
  fileName: z.string().max(255).optional(),
  mimeType: z.string().max(120).optional(),
  fileSize: z.coerce.number().int().min(0).optional(),
  storageProvider: z.string().max(32).optional(),
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
