import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import {
  createStudentSchema,
  createTeacherSchema,
  changeRoleSchema,
  suspendUserSchema,
  resetPasswordSchema,
} from "./admin.validation.js";
import * as adminController from "./admin.controller.js";

export const adminRoutes = Router();

adminRoutes.use(authenticate, authorize("ADMIN"));

adminRoutes.get("/stats", asyncHandler(adminController.platformStats));
adminRoutes.get("/analytics/student-growth", asyncHandler(adminController.studentGrowth));

adminRoutes.get("/users", asyncHandler(adminController.listUsers));
adminRoutes.post(
  "/users/students",
  validateBody(createStudentSchema),
  asyncHandler(adminController.createStudent),
);
adminRoutes.post(
  "/users/teachers",
  validateBody(createTeacherSchema),
  asyncHandler(adminController.createTeacher),
);
adminRoutes.post("/users", validateBody(createTeacherSchema), asyncHandler(adminController.createTeacher));
adminRoutes.get("/users/:userId", asyncHandler(adminController.getUser));
adminRoutes.patch(
  "/users/:userId/role",
  validateBody(changeRoleSchema),
  asyncHandler(adminController.changeRole),
);
adminRoutes.patch(
  "/users/:userId/suspend",
  validateBody(suspendUserSchema),
  asyncHandler(adminController.suspendUser),
);
adminRoutes.post(
  "/users/:userId/reset-password",
  validateBody(resetPasswordSchema),
  asyncHandler(adminController.resetPassword),
);
adminRoutes.delete("/users/:userId", asyncHandler(adminController.deleteUser));

adminRoutes.get("/review-queue", asyncHandler(adminController.reviewQueue));
adminRoutes.get("/pending-deletes", asyncHandler(adminController.pendingDeletes));
adminRoutes.post("/pending-deletes/approve", asyncHandler(adminController.approveDelete));
adminRoutes.post("/pending-deletes/reject", asyncHandler(adminController.rejectDelete));

adminRoutes.get("/courses", asyncHandler(adminController.listCourses));
adminRoutes.get("/courses/:courseId/analytics", asyncHandler(adminController.courseAnalytics));
adminRoutes.patch("/courses/:courseId/approve", asyncHandler(adminController.publishCourse));
adminRoutes.patch("/courses/:courseId/reject", asyncHandler(adminController.rejectCourse));
adminRoutes.patch("/courses/:courseId/publish", asyncHandler(adminController.publishCourse));
adminRoutes.patch("/courses/:courseId/archive", asyncHandler(adminController.archiveCourse));
adminRoutes.delete("/courses/:courseId", asyncHandler(adminController.deleteCourse));

adminRoutes.get("/activity", asyncHandler(adminController.listActivity));

adminRoutes.get("/resources", asyncHandler(adminController.listResources));
adminRoutes.delete("/resources/:resourceId", asyncHandler(adminController.removeResource));
adminRoutes.patch("/resources/:resourceId/restore", asyncHandler(adminController.restoreResource));

adminRoutes.get("/certificates", asyncHandler(adminController.listCertificates));
adminRoutes.get(
  "/certificates/:certificateId/download",
  asyncHandler(adminController.downloadCertificate),
);
