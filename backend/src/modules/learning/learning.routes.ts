import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { watchProgressSchema } from "./learning.validation.js";
import * as learningController from "./learning.controller.js";

export const learningRoutes = Router();

learningRoutes.use(authenticate);

learningRoutes.get(
  "/preview/:slug",
  authorize("ADMIN"),
  asyncHandler(learningController.previewCourse),
);

learningRoutes.use(authorize("STUDENT"));

learningRoutes.post("/courses/:slug/enroll", asyncHandler(learningController.enroll));

learningRoutes.get("/enrollments", asyncHandler(learningController.enrolledCourses));

learningRoutes.get("/courses/:slug/progress", asyncHandler(learningController.courseProgress));

learningRoutes.post("/lessons/:lessonId/complete", asyncHandler(learningController.completeLesson));

learningRoutes.patch(
  "/lessons/:lessonId/watch",
  validateBody(watchProgressSchema),
  asyncHandler(learningController.watchProgress),
);

learningRoutes.get("/continue", asyncHandler(learningController.continueLearning));

learningRoutes.get("/analytics", asyncHandler(learningController.analytics));
