import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { assignBatchCourseSchema, assignStudentCourseSchema } from "./course-access.validation.js";
import * as accessController from "./course-access.controller.js";

export const courseAccessRoutes = Router();

courseAccessRoutes.use(authenticate);

courseAccessRoutes.get("/my-courses", authorize("STUDENT"), asyncHandler(accessController.myCourses));
courseAccessRoutes.get(
  "/my-status",
  authorize("STUDENT"),
  asyncHandler(accessController.myAccessStatus),
);

courseAccessRoutes.get("/", authorize("ADMIN"), asyncHandler(accessController.listAccess));
courseAccessRoutes.post(
  "/assign",
  authorize("ADMIN"),
  validateBody(assignStudentCourseSchema),
  asyncHandler(accessController.assignStudent),
);
courseAccessRoutes.post(
  "/batches/:batchId/courses",
  authorize("ADMIN"),
  validateBody(assignBatchCourseSchema),
  asyncHandler(accessController.assignBatch),
);
courseAccessRoutes.delete(
  "/:studentId/:courseId",
  authorize("ADMIN"),
  asyncHandler(accessController.revoke),
);
courseAccessRoutes.post(
  "/:studentId/:courseId/lifetime",
  authorize("ADMIN"),
  asyncHandler(accessController.grantLifetime),
);
