import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { createResourceSchema, updateResourceSchema } from "./resources.validation.js";
import * as resourcesController from "./resources.controller.js";

export const resourcesRoutes = Router();

resourcesRoutes.use(authenticate);

resourcesRoutes.get(
  "/mine",
  authorize("TEACHER", "ADMIN"),
  asyncHandler(resourcesController.listMine),
);

resourcesRoutes.get(
  "/enrolled",
  authorize("STUDENT"),
  asyncHandler(resourcesController.listEnrolled),
);

resourcesRoutes.post(
  "/",
  authorize("TEACHER", "ADMIN"),
  validateBody(createResourceSchema),
  asyncHandler(resourcesController.create),
);

resourcesRoutes.get(
  "/course/:courseId/student",
  authorize("STUDENT"),
  asyncHandler(resourcesController.listByCourseStudent),
);

resourcesRoutes.get(
  "/course/:courseId",
  authorize("TEACHER", "ADMIN", "STUDENT"),
  asyncHandler(resourcesController.listByCourse),
);

resourcesRoutes.get(
  "/lesson/:lessonId/student",
  authorize("STUDENT"),
  asyncHandler(resourcesController.listByLessonStudent),
);

resourcesRoutes.get(
  "/lesson/:lessonId",
  authorize("TEACHER", "ADMIN", "STUDENT"),
  asyncHandler(resourcesController.listByLesson),
);

resourcesRoutes.patch(
  "/:resourceId",
  authorize("TEACHER", "ADMIN"),
  validateBody(updateResourceSchema),
  asyncHandler(resourcesController.update),
);

resourcesRoutes.delete(
  "/:resourceId",
  authorize("TEACHER", "ADMIN"),
  asyncHandler(resourcesController.remove),
);
