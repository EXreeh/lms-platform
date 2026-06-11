import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize, authorizeAdmin } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { createSalarySchema, updateSalarySchema } from "./teacher-salary.validation.js";
import * as salaryController from "./teacher-salary.controller.js";

export const teacherSalaryRoutes = Router();

teacherSalaryRoutes.use(authenticate);

teacherSalaryRoutes.get("/me", authorize("TEACHER"), asyncHandler(salaryController.teacherMine));

teacherSalaryRoutes.get("/", authorizeAdmin(), asyncHandler(salaryController.listAdmin));
teacherSalaryRoutes.post(
  "/",
  authorizeAdmin(),
  validateBody(createSalarySchema),
  asyncHandler(salaryController.create),
);
teacherSalaryRoutes.get("/:salaryId", authorizeAdmin(), asyncHandler(salaryController.getOne));
teacherSalaryRoutes.patch(
  "/:salaryId",
  authorizeAdmin(),
  validateBody(updateSalarySchema),
  asyncHandler(salaryController.update),
);
teacherSalaryRoutes.post(
  "/:salaryId/mark-paid",
  authorizeAdmin(),
  asyncHandler(salaryController.markPaid),
);
teacherSalaryRoutes.post(
  "/:salaryId/mark-hold",
  authorizeAdmin(),
  asyncHandler(salaryController.markHold),
);
