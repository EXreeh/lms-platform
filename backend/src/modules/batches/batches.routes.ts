import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import {
  batchStudentsSchema,
  createBatchSchema,
  updateBatchSchema,
} from "./batches.validation.js";
import * as batchesController from "./batches.controller.js";

export const batchesRoutes = Router();

batchesRoutes.use(authenticate);

batchesRoutes.get("/me", authorize("STUDENT"), asyncHandler(batchesController.studentMine));
batchesRoutes.get(
  "/teacher",
  authorize("TEACHER"),
  asyncHandler(batchesController.teacherList),
);

batchesRoutes.get(
  "/",
  authorize("ADMIN"),
  asyncHandler(batchesController.listAdmin),
);
batchesRoutes.post(
  "/",
  authorize("ADMIN"),
  validateBody(createBatchSchema),
  asyncHandler(batchesController.create),
);

batchesRoutes.get(
  "/:batchId/recordings",
  authorize("ADMIN", "TEACHER", "STUDENT"),
  asyncHandler(batchesController.batchRecordings),
);
batchesRoutes.get("/:batchId", asyncHandler(batchesController.getOne));
batchesRoutes.patch(
  "/:batchId",
  authorize("ADMIN"),
  validateBody(updateBatchSchema),
  asyncHandler(batchesController.update),
);
batchesRoutes.post(
  "/:batchId/students",
  authorize("ADMIN"),
  validateBody(batchStudentsSchema),
  asyncHandler(batchesController.addStudents),
);
batchesRoutes.delete(
  "/:batchId/students/:studentId",
  authorize("ADMIN"),
  asyncHandler(batchesController.removeStudent),
);
batchesRoutes.delete(
  "/:batchId",
  authorize("ADMIN"),
  asyncHandler(batchesController.removeBatch),
);
