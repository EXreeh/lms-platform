import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize, authorizeAdmin } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { validateQuery } from "../../middleware/validate-query.js";
import {
  adminUpdateAttendanceSchema,
  listAttendanceQuerySchema,
  markAttendanceSchema,
  markMissingAbsentSchema,
  submitLeaveSchema,
} from "./teacher-attendance.validation.js";
import * as controller from "./teacher-attendance.controller.js";

export const teacherAttendanceRoutes = Router();

teacherAttendanceRoutes.use(authenticate);

teacherAttendanceRoutes.post(
  "/me",
  authorize("TEACHER"),
  validateBody(markAttendanceSchema),
  asyncHandler(controller.teacherMarkToday),
);
teacherAttendanceRoutes.get(
  "/me",
  authorize("TEACHER"),
  asyncHandler(controller.teacherHistory),
);
teacherAttendanceRoutes.post(
  "/leave",
  authorize("TEACHER"),
  validateBody(submitLeaveSchema),
  asyncHandler(controller.teacherSubmitLeave),
);
teacherAttendanceRoutes.get(
  "/leave/me",
  authorize("TEACHER"),
  asyncHandler(controller.teacherLeaveList),
);

teacherAttendanceRoutes.get(
  "/summary",
  authorizeAdmin(),
  asyncHandler(controller.adminSummary),
);
teacherAttendanceRoutes.get(
  "/",
  authorizeAdmin(),
  validateQuery(listAttendanceQuerySchema),
  asyncHandler(controller.adminList),
);
teacherAttendanceRoutes.patch(
  "/:attendanceId",
  authorizeAdmin(),
  validateBody(adminUpdateAttendanceSchema),
  asyncHandler(controller.adminUpdate),
);
teacherAttendanceRoutes.get(
  "/leave",
  authorizeAdmin(),
  asyncHandler(controller.adminLeaveList),
);
teacherAttendanceRoutes.post(
  "/leave/:leaveId/approve",
  authorizeAdmin(),
  asyncHandler(controller.adminApproveLeave),
);
teacherAttendanceRoutes.post(
  "/leave/:leaveId/reject",
  authorizeAdmin(),
  asyncHandler(controller.adminRejectLeave),
);
teacherAttendanceRoutes.post(
  "/mark-missing-absent",
  authorizeAdmin(),
  validateBody(markMissingAbsentSchema),
  asyncHandler(controller.adminMarkMissingAbsent),
);
