import type { Request, Response } from "express";
import * as adminService from "./admin.service.js";
import { ApiError } from "../../utils/api-error.js";
import {
  listUsersQuerySchema,
  createTeacherSchema,
  changeRoleSchema,
  suspendUserSchema,
  resetPasswordSchema,
  listCoursesQuerySchema,
  listActivityQuerySchema,
} from "./admin.validation.js";

function requireAdmin(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.role !== "ADMIN") {
    throw ApiError.forbidden("Admin access required");
  }
  return req.user;
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const query = listUsersQuerySchema.parse(req.query);
  const data = await adminService.listUsers(query);
  res.json({ success: true, data });
}

export async function getUser(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const data = await adminService.getUserDetails(req.params.userId);
  res.json({ success: true, data });
}

export async function createTeacher(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const input = createTeacherSchema.parse(req.body);
  const user = await adminService.createTeacher(admin.id, input);
  res.status(201).json({ success: true, data: { user } });
}

export async function changeRole(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const input = changeRoleSchema.parse(req.body);
  const user = await adminService.changeUserRole(admin.id, req.params.userId, input);
  res.json({ success: true, data: { user } });
}

export async function suspendUser(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const input = suspendUserSchema.parse(req.body);
  const user = await adminService.suspendUser(admin.id, req.params.userId, input);
  res.json({ success: true, data: { user } });
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const result = await adminService.deleteUser(admin.id, req.params.userId);
  res.json({ success: true, ...result });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const input = resetPasswordSchema.parse(req.body);
  const result = await adminService.resetUserPassword(admin.id, req.params.userId, input);
  res.json({ success: true, ...result });
}

export async function listCourses(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const query = listCoursesQuerySchema.parse(req.query);
  const data = await adminService.listAdminCourses(query);
  res.json({ success: true, data });
}

export async function courseAnalytics(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const data = await adminService.getCourseAnalytics(req.params.courseId);
  res.json({ success: true, data });
}

export async function publishCourse(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const approved = Boolean(req.body?.published ?? req.body?.approved);
  const course = await adminService.adminPublishCourse(req.user!.id, req.params.courseId, approved);
  res.json({ success: true, data: { course } });
}

export async function rejectCourse(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const reason = typeof req.body?.reason === "string" ? req.body.reason : undefined;
  const course = await adminService.adminRejectCourse(admin.id, req.params.courseId, reason);
  res.json({ success: true, data: { course } });
}

export async function archiveCourse(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const course = await adminService.adminArchiveCourse(admin.id, req.params.courseId);
  res.json({ success: true, data: { course } });
}

export async function deleteCourse(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const result = await adminService.adminDeleteCourse(admin.id, req.params.courseId);
  res.json({ success: true, ...result });
}

export async function reviewQueue(_req: Request, res: Response): Promise<void> {
  const courses = await adminService.getReviewQueue();
  res.json({ success: true, data: { courses } });
}

export async function pendingDeletes(_req: Request, res: Response): Promise<void> {
  const data = await adminService.getPendingDeleteRequests();
  res.json({ success: true, data });
}

export async function approveDelete(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const { entityType, entityId } = req.body as {
    entityType: "course" | "module" | "lesson" | "quiz";
    entityId: string;
  };
  const result = await adminService.approveDeleteRequest(admin.id, entityType, entityId);
  res.json({ success: true, ...result });
}

export async function rejectDelete(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const { entityType, entityId } = req.body as {
    entityType: "course" | "module" | "lesson" | "quiz";
    entityId: string;
  };
  const result = await adminService.rejectDeleteRequest(entityType, entityId);
  res.json({ success: true, ...result });
}

export async function listActivity(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const query = listActivityQuerySchema.parse(req.query);
  const data = await adminService.listActivity(query);
  res.json({ success: true, data });
}

export async function platformStats(_req: Request, res: Response): Promise<void> {
  const stats = await adminService.getPlatformStats();
  res.json({ success: true, data: { stats } });
}
