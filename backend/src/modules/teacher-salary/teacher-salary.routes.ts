import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { createSalarySchema, updateSalarySchema } from "./teacher-salary.validation.js";
import * as salaryController from "./teacher-salary.controller.js";

export const teacherSalaryRoutes = Router();

teacherSalaryRoutes.use(authenticate);

teacherSalaryRoutes.get("/me", authorize("TEACHER"), asyncHandler(salaryController.teacherMine));

teacherSalaryRoutes.get("/", authorize("ADMIN"), asyncHandler(salaryController.listAdmin));
teacherSalaryRoutes.post(
  "/",
  authorize("ADMIN"),
  validateBody(createSalarySchema),
  asyncHandler(salaryController.create),
);
teacherSalaryRoutes.get("/:salaryId", authorize("ADMIN"), asyncHandler(salaryController.getOne));
teacherSalaryRoutes.patch(
  "/:salaryId",
  authorize("ADMIN"),
  validateBody(updateSalarySchema),
  asyncHandler(salaryController.update),
);
teacherSalaryRoutes.post(
  "/:salaryId/mark-paid",
  authorize("ADMIN"),
  asyncHandler(salaryController.markPaid),
);
teacherSalaryRoutes.post(
  "/:salaryId/mark-hold",
  authorize("ADMIN"),
  asyncHandler(salaryController.markHold),
);
