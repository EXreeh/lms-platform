import type { Request, Response } from "express";
import * as dashboardService from "./dashboard.service.js";
import { ApiError } from "../../utils/api-error.js";

export async function teacher(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const data = await dashboardService.getTeacherDashboard(req.user.id);
  res.json({ success: true, data });
}

export async function admin(_req: Request, res: Response): Promise<void> {
  const data = await dashboardService.getAdminDashboard();
  res.json({ success: true, data });
}

export async function student(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const data = await dashboardService.getStudentDashboard(req.user.id);
  res.json({ success: true, data });
}
