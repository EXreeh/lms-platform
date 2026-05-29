import { z } from "zod";

export const roleEnum = z.enum(["STUDENT", "TEACHER", "ADMIN"]);

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: roleEnum.optional(),
  suspended: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  sortBy: z.enum(["createdAt", "lastName", "email", "role"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createTeacherSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const changeRoleSchema = z.object({
  role: z.enum(["STUDENT", "TEACHER"]),
});

export const suspendUserSchema = z.object({
  suspended: z.boolean(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8).max(128),
});

export const courseStatusEnum = z.enum([
  "DRAFT",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
]);

export const listCoursesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: courseStatusEnum.optional(),
  deleteStatus: z.enum(["ACTIVE", "PENDING_DELETE", "DELETED"]).optional(),
  teacherId: z.string().optional(),
  sortBy: z.enum(["createdAt", "title", "updatedAt"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const listActivityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z
    .enum([
      "LOGIN",
      "COURSE_CREATED",
      "COURSE_UPDATED",
      "COURSE_SUBMITTED",
      "COURSE_APPROVED",
      "COURSE_REJECTED",
      "COURSE_PUBLISHED",
      "COURSE_ARCHIVED",
      "DELETE_REQUESTED",
      "DELETE_APPROVED",
      "ENROLLMENT",
      "QUIZ_ATTEMPT",
      "USER_ROLE_CHANGED",
      "USER_SUSPENDED",
      "USER_CREATED",
    ])
    .optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ListAdminCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
export type ListActivityQuery = z.infer<typeof listActivityQuerySchema>;
