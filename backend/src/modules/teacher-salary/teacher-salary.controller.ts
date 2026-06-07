import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import * as salaryService from "./teacher-salary.service.js";
import {
  createSalarySchema,
  salaryListQuerySchema,
  updateSalarySchema,
} from "./teacher-salary.validation.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export async function listAdmin(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const query = salaryListQuerySchema.parse(req.query);
  const { data, summary } = await salaryService.listSalariesWithSummary(query);
  res.json({ success: true, data, summary });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const data = await salaryService.getSalaryById(req.params.salaryId);
  res.json({ success: true, data });
}

export async function create(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const body = createSalarySchema.parse(req.body);
  const data = await salaryService.createSalary(body);
  res.status(201).json({ success: true, data });
}

export async function update(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const body = updateSalarySchema.parse(req.body);
  const data = await salaryService.updateSalary(req.params.salaryId, body);
  res.json({ success: true, data });
}

export async function markPaid(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const data = await salaryService.markSalaryPaid(req.params.salaryId);
  res.json({ success: true, data });
}

export async function markHold(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const data = await salaryService.markSalaryHold(req.params.salaryId);
  res.json({ success: true, data });
}

export async function teacherMine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (user.role !== "TEACHER") throw ApiError.forbidden("Teachers only");
  const data = await salaryService.getTeacherSalaryDashboard(user.id);
  res.json({ success: true, data });
}
