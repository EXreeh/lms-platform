import { z } from "zod";

/** Accepts external URLs, cloud storage URLs, or local /uploads/ paths */
export const urlOrUploadPath = z.union([
  z.string().url(),
  z.string().regex(/^\/uploads\/(videos|resources|thumbnails)\/[\w.\-]+$/i),
  z.string().regex(/^https?:\/\/[^\s]+\/(videos|resources|thumbnails)\/[\w.\-]+$/i),
  z.literal(""),
]);

export const courseLevelEnum = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

export const createCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(10000),
  thumbnail: urlOrUploadPath.optional(),
  thumbnailFileName: z.string().max(255).optional(),
  price: z.coerce.number().min(0, "Price cannot be negative").max(999999),
  category: z.string().min(2).max(80),
  level: courseLevelEnum.default("BEGINNER"),
});

export const updateCourseSchema = createCourseSchema.partial();

export const courseStatusEnum = z.enum([
  "DRAFT",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
]);

export const listCoursesQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  level: courseLevelEnum.optional(),
  status: courseStatusEnum.optional(),
  mine: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export const createModuleSchema = z.object({
  title: z.string().min(2).max(200),
  order: z.coerce.number().int().min(0).optional(),
});

export const updateModuleSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  order: z.coerce.number().int().min(0).optional(),
});

export const createLessonSchema = z.object({
  title: z.string().min(2, "Lesson title must be at least 2 characters").max(200),
  description: z.string().max(5000).optional(),
  videoUrl: urlOrUploadPath.optional(),
  videoFileName: z.string().max(255).nullish(),
  videoMimeType: z.string().max(120).nullish(),
  videoSize: z.coerce.number().int().min(0).nullish(),
  videoStorageProvider: z.string().max(32).nullish(),
  videoStorageKey: z.string().max(512).nullish(),
  duration: z.coerce.number().int().min(0).default(0),
  order: z.coerce.number().int().min(0).optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

export const publishCourseSchema = z.object({
  published: z.boolean(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export type ReorderInput = z.infer<typeof reorderSchema>;
