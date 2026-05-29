import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import {
  createQuizSchema,
  updateQuizSchema,
  createQuestionSchema,
  updateQuestionSchema,
  submitQuizSchema,
} from "./quizzes.validation.js";
import * as quizzesController from "./quizzes.controller.js";

export const quizzesRoutes = Router();

quizzesRoutes.use(authenticate);

// Teacher / Admin — specific paths first
quizzesRoutes.get(
  "/mine",
  authorize("TEACHER", "ADMIN"),
  asyncHandler(quizzesController.listMine),
);

quizzesRoutes.post(
  "/",
  authorize("TEACHER", "ADMIN"),
  validateBody(createQuizSchema),
  asyncHandler(quizzesController.create),
);

quizzesRoutes.get(
  "/lessons/:lessonId/student",
  authorize("STUDENT"),
  asyncHandler(quizzesController.listForLessonStudent),
);

quizzesRoutes.get(
  "/lessons/:lessonId",
  authorize("TEACHER", "ADMIN"),
  asyncHandler(quizzesController.listByLesson),
);

quizzesRoutes.patch(
  "/questions/:questionId",
  authorize("TEACHER", "ADMIN"),
  validateBody(updateQuestionSchema),
  asyncHandler(quizzesController.patchQuestion),
);

quizzesRoutes.delete(
  "/questions/:questionId",
  authorize("TEACHER", "ADMIN"),
  asyncHandler(quizzesController.removeQuestion),
);

// Student quiz flow
quizzesRoutes.get(
  "/:quizId/preview",
  authorize("STUDENT"),
  asyncHandler(quizzesController.preview),
);

quizzesRoutes.post(
  "/:quizId/start",
  authorize("STUDENT"),
  asyncHandler(quizzesController.start),
);

quizzesRoutes.get(
  "/:quizId/analytics",
  authorize("TEACHER", "ADMIN"),
  asyncHandler(quizzesController.analytics),
);

quizzesRoutes.post(
  "/:quizId/questions",
  authorize("TEACHER", "ADMIN"),
  validateBody(createQuestionSchema),
  asyncHandler(quizzesController.addQuestion),
);

quizzesRoutes.get(
  "/:quizId",
  authorize("TEACHER", "ADMIN"),
  asyncHandler(quizzesController.getOne),
);

quizzesRoutes.patch(
  "/:quizId",
  authorize("TEACHER", "ADMIN"),
  validateBody(updateQuizSchema),
  asyncHandler(quizzesController.update),
);

quizzesRoutes.delete(
  "/:quizId",
  authorize("TEACHER", "ADMIN"),
  asyncHandler(quizzesController.remove),
);

export const quizAttemptRoutes = Router();

quizAttemptRoutes.use(authenticate, authorize("STUDENT"));

quizAttemptRoutes.get("/:attemptId", asyncHandler(quizzesController.getAttempt));

quizAttemptRoutes.post(
  "/:attemptId/submit",
  validateBody(submitQuizSchema),
  asyncHandler(quizzesController.submit),
);

quizAttemptRoutes.get("/:attemptId/result", asyncHandler(quizzesController.result));
