import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import * as service from "./teacher-attendance.service.js";
import {
  adminUpdateAttendanceSchema,
  listAttendanceQuerySchema,
  markAttendanceSchema,
  markMissingAbsentSchema,
  submitLeaveSchema,
} from "./teacher-attendance.validation.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export async function teacherMarkToday(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const body = markAttendanceSchema.parse(req.body);
  const data = await service.markTeacherAttendance(user.id, body);
  res.json({ success: true, data });
}

export async function teacherHistory(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await service.getTeacherAttendanceHistory(user.id);
  res.json({ success: true, data });
}

export async function teacherSubmitLeave(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const body = submitLeaveSchema.parse(req.body);
  const data = await service.submitLeaveRequest(user.id, body);
  res.status(201).json({ success: true, data });
}

export async function teacherLeaveList(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await service.getTeacherLeaveRequests(user.id);
  res.json({ success: true, data });
}

export async function adminList(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const query = listAttendanceQuerySchema.parse(req.query);
  const data = await service.listAttendance(query);
  res.json({ success: true, data });
}

export async function adminSummary(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  const data = await service.getAttendanceDashboardSummary(date);
  res.json({ success: true, data });
}

export async function adminUpdate(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const body = adminUpdateAttendanceSchema.parse(req.body);
  const data = await service.adminUpdateAttendance(req.params.attendanceId, body);
  res.json({ success: true, data });
}

export async function adminLeaveList(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const status =
    typeof req.query.status === "string"
      ? (req.query.status as "PENDING" | "APPROVED" | "REJECTED")
      : undefined;
  const data = await service.listLeaveRequests(status ? { status } : undefined);
  res.json({ success: true, data });
}

export async function adminApproveLeave(req: Request, res: Response): Promise<void> {
  const admin = requireUser(req);
  const data = await service.reviewLeaveRequest(admin.id, req.params.leaveId, true);
  res.json({ success: true, data });
}

export async function adminRejectLeave(req: Request, res: Response): Promise<void> {
  const admin = requireUser(req);
  const data = await service.reviewLeaveRequest(admin.id, req.params.leaveId, false);
  res.json({ success: true, data });
}

export async function adminMarkMissingAbsent(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const body = markMissingAbsentSchema.parse(req.body ?? {});
  const data = await service.markMissingTeachersAbsent(body.date);
  res.json({ success: true, data });
}
