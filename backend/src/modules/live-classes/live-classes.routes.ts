import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import {
  createLiveClassSchema,
  createRecordingSchema,
  updateLiveClassSchema,
  updateLiveClassStatusSchema,
} from "./live-classes.validation.js";
import {
  handleMulterErrorForCategory,
  uploadVideoMiddleware,
  validateUploadedFileMiddleware,
} from "../uploads/uploads.middleware.js";
import * as liveClassesController from "./live-classes.controller.js";

export const liveClassesRoutes = Router();
export const adminLiveClassesRoutes = Router();
export const teacherLiveClassesRoutes = Router();
export const studentLiveClassesRoutes = Router();
export const recordingsRoutes = Router();

const recordingUpload = [
  uploadVideoMiddleware,
  validateUploadedFileMiddleware("video"),
  handleMulterErrorForCategory("video"),
];

// Shared authenticated routes
liveClassesRoutes.use(authenticate);
liveClassesRoutes.get("/", asyncHandler(liveClassesController.list));
liveClassesRoutes.get("/stats", asyncHandler(liveClassesController.stats));
liveClassesRoutes.post("/:id/join", asyncHandler(liveClassesController.join));
liveClassesRoutes.get("/:id", asyncHandler(liveClassesController.getOne));
liveClassesRoutes.post(
  "/:id/recordings",
  authorize("ADMIN", "TEACHER"),
  ...recordingUpload,
  validateBody(createRecordingSchema),
  asyncHandler(liveClassesController.uploadRecording),
);

// Admin routes
adminLiveClassesRoutes.use(authenticate, authorize("ADMIN"));
adminLiveClassesRoutes.get("/", asyncHandler(liveClassesController.list));
adminLiveClassesRoutes.post(
  "/",
  validateBody(createLiveClassSchema),
  asyncHandler(liveClassesController.create),
);
adminLiveClassesRoutes.patch(
  "/:id",
  validateBody(updateLiveClassSchema),
  asyncHandler(liveClassesController.update),
);
adminLiveClassesRoutes.patch(
  "/:id/status",
  validateBody(updateLiveClassStatusSchema),
  asyncHandler(liveClassesController.updateStatus),
);
adminLiveClassesRoutes.delete("/:id", asyncHandler(liveClassesController.remove));
adminLiveClassesRoutes.get("/recordings/list", asyncHandler(liveClassesController.listRecordings));

// Teacher routes
teacherLiveClassesRoutes.use(authenticate, authorize("TEACHER"));
teacherLiveClassesRoutes.get("/", asyncHandler(liveClassesController.list));
teacherLiveClassesRoutes.post(
  "/",
  validateBody(createLiveClassSchema),
  asyncHandler(liveClassesController.create),
);
teacherLiveClassesRoutes.patch(
  "/:id",
  validateBody(updateLiveClassSchema),
  asyncHandler(liveClassesController.update),
);
teacherLiveClassesRoutes.patch(
  "/:id/status",
  validateBody(updateLiveClassStatusSchema),
  asyncHandler(liveClassesController.updateStatus),
);
teacherLiveClassesRoutes.post(
  "/:id/recordings",
  ...recordingUpload,
  validateBody(createRecordingSchema),
  asyncHandler(liveClassesController.uploadRecording),
);
teacherLiveClassesRoutes.get(
  "/batches/:batchId/recordings",
  asyncHandler(liveClassesController.studentBatchRecordings),
);

// Student routes — specific paths before /:id
studentLiveClassesRoutes.use(authenticate, authorize("STUDENT"));
studentLiveClassesRoutes.get("/", asyncHandler(liveClassesController.list));
studentLiveClassesRoutes.get("/upcoming", asyncHandler(liveClassesController.listUpcoming));
studentLiveClassesRoutes.get(
  "/batches/:batchId/recordings",
  asyncHandler(liveClassesController.studentBatchRecordings),
);
studentLiveClassesRoutes.get(
  "/courses/:courseId/batch-recordings",
  asyncHandler(liveClassesController.studentCourseBatchRecordings),
);
studentLiveClassesRoutes.get("/:id", asyncHandler(liveClassesController.getOne));

// Shared recordings routes
recordingsRoutes.use(authenticate);
recordingsRoutes.get("/:id", asyncHandler(liveClassesController.getRecording));
recordingsRoutes.patch(
  "/:id/archive",
  authorize("ADMIN", "TEACHER"),
  asyncHandler(liveClassesController.archiveRecording),
);
recordingsRoutes.delete(
  "/:id",
  authorize("ADMIN", "TEACHER"),
  asyncHandler(liveClassesController.deleteRecording),
);
