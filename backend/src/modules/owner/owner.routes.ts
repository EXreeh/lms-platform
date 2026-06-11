import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorizeAdmin } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import {
  changeRoleSchema,
  createAdminSchema,
  createStudentSchema,
  createTeacherSchema,
  resetPasswordSchema,
  suspendUserSchema,
} from "../admin/admin.validation.js";
import * as ownerController from "./owner.controller.js";

export const ownerRoutes = Router();

ownerRoutes.use(authenticate, authorizeAdmin());

ownerRoutes.get("/users", asyncHandler(ownerController.listUsers));
ownerRoutes.get("/admins", asyncHandler(ownerController.listAdmins));
ownerRoutes.post("/admins", validateBody(createAdminSchema), asyncHandler(ownerController.createAdmin));
ownerRoutes.post("/teachers", validateBody(createTeacherSchema), asyncHandler(ownerController.createTeacher));
ownerRoutes.post("/students", validateBody(createStudentSchema), asyncHandler(ownerController.createStudent));
ownerRoutes.patch(
  "/users/:userId/role",
  validateBody(changeRoleSchema),
  asyncHandler(ownerController.changeRole),
);
ownerRoutes.patch(
  "/users/:userId/suspend",
  validateBody(suspendUserSchema),
  asyncHandler(ownerController.suspendUser),
);
ownerRoutes.post(
  "/users/:userId/reset-password",
  validateBody(resetPasswordSchema),
  asyncHandler(ownerController.resetPassword),
);
ownerRoutes.get("/audit-logs", asyncHandler(ownerController.auditLogs));
ownerRoutes.get("/login-history", asyncHandler(ownerController.loginHistory));
ownerRoutes.get("/security", asyncHandler(ownerController.securitySettings));
ownerRoutes.get("/system-settings", asyncHandler(ownerController.securitySettings));
