import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { optionalAuthenticate } from "../../middleware/optional-authenticate.js";
import { authorize, authorizeAdmin } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import {
  createCourseSchema,
  updateCourseSchema,
  createModuleSchema,
  createLessonSchema,
  publishCourseSchema,
  updateModuleSchema,
  updateLessonSchema,
  reorderSchema,
} from "./courses.validation.js";
import * as coursesController from "./courses.controller.js";

export const coursesRoutes = Router();

coursesRoutes.get("/categories", asyncHandler(coursesController.categories));

coursesRoutes.get("/", optionalAuthenticate, asyncHandler(coursesController.list));

coursesRoutes.post(
  "/",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  validateBody(createCourseSchema),
  asyncHandler(coursesController.create),
);

coursesRoutes.patch(
  "/modules/:moduleId",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  validateBody(updateModuleSchema),
  asyncHandler(coursesController.patchModule),
);

coursesRoutes.delete(
  "/modules/:moduleId",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(coursesController.removeModule),
);

coursesRoutes.patch(
  "/modules/:moduleId/lessons/reorder",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  validateBody(reorderSchema),
  asyncHandler(coursesController.reorderLessons),
);

coursesRoutes.post(
  "/modules/:moduleId/lessons",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  validateBody(createLessonSchema),
  asyncHandler(coursesController.addLesson),
);

coursesRoutes.patch(
  "/lessons/:lessonId",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  validateBody(updateLessonSchema),
  asyncHandler(coursesController.patchLesson),
);

coursesRoutes.delete(
  "/lessons/:lessonId",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(coursesController.removeLesson),
);

coursesRoutes.get("/:idOrSlug", optionalAuthenticate, asyncHandler(coursesController.getOne));

coursesRoutes.patch(
  "/:idOrSlug",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  validateBody(updateCourseSchema),
  asyncHandler(coursesController.update),
);

coursesRoutes.delete(
  "/:idOrSlug",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(coursesController.remove),
);

coursesRoutes.patch(
  "/:idOrSlug/submit-review",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(coursesController.submitForReview),
);

coursesRoutes.patch(
  "/:idOrSlug/publish",
  authenticate,
  authorizeAdmin(),
  validateBody(publishCourseSchema),
  asyncHandler(coursesController.publish),
);

coursesRoutes.post(
  "/:idOrSlug/enroll",
  authenticate,
  authorize("STUDENT"),
  asyncHandler(coursesController.enroll),
);

coursesRoutes.post(
  "/:courseId/modules",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  validateBody(createModuleSchema),
  asyncHandler(coursesController.addModule),
);

coursesRoutes.patch(
  "/:courseId/modules/reorder",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  validateBody(reorderSchema),
  asyncHandler(coursesController.reorderModules),
);
