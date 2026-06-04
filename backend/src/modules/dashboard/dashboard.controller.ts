import type { Request, Response } from "express";
import * as dashboardService from "./dashboard.service.js";
import { ApiError } from "../../utils/api-error.js";

export async function teacher(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const data = await dashboardService.getTeacherDashboard(req.user.id);
  res.json({ success: true, data });
}

export async function admin(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const data = await dashboardService.getAdminDashboard(req.user.id);
  res.json({ success: true, data });
}

export async function student(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const data = await dashboardService.getStudentDashboard(req.user.id);
  res.json({ success: true, data });
}
