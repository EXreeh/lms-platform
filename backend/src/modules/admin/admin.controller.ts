import type { Request, Response } from "express";
import * as adminService from "./admin.service.js";
import { ApiError } from "../../utils/api-error.js";
import {
  listUsersQuerySchema,
  createAdminSchema,
  createStudentSchema,
  createTeacherSchema,
  changeRoleSchema,
  suspendUserSchema,
  resetPasswordSchema,
  listCoursesQuerySchema,
  listActivityQuerySchema,
  listAuditLogsQuerySchema,
} from "./admin.validation.js";

import { isAdminRole } from "../../utils/roles.js";

function requireAdmin(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  if (!isAdminRole(req.user.role)) {
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

export async function createStudent(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const input = createStudentSchema.parse(req.body);
  const data = await adminService.createStudent(admin.id, input);
  res.status(201).json({ success: true, data });
}

export async function createTeacher(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const input = createTeacherSchema.parse(req.body);
  const data = await adminService.createTeacher(admin.id, input);
  res.status(201).json({ success: true, data });
}

export async function createAdmin(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const input = createAdminSchema.parse(req.body);
  const data = await adminService.createAdmin(admin.id, input);
  res.status(201).json({ success: true, data });
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

export async function archiveDemoCourses(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const result = await adminService.archiveDemoCourses(admin.id);
  res.json({ success: true, data: result });
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

export async function studentGrowth(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const days = Math.min(365, Math.max(7, parseInt(String(req.query.days ?? "90"), 10) || 90));
  const data = await adminService.getStudentGrowth(days);
  res.json({ success: true, data });
}

export async function listResources(_req: Request, res: Response): Promise<void> {
  requireAdmin(_req);
  const resources = await adminService.listAdminResources();
  res.json({ success: true, data: { resources } });
}

export async function removeResource(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const result = await adminService.adminRemoveResource(admin.id, req.params.resourceId);
  res.json({ success: true, ...result });
}

export async function restoreResource(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const result = await adminService.adminRestoreResource(req.params.resourceId);
  res.json({ success: true, ...result });
}

export async function listCertificates(_req: Request, res: Response): Promise<void> {
  requireAdmin(_req);
  const certificates = await adminService.listAdminCertificates();
  res.json({ success: true, data: { certificates } });
}

export async function downloadCertificate(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  await adminService.streamCertificatePdfAdmin(res, req.params.certificateId, admin.id);
}

export async function listAdmins(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const data = await adminService.listAdmins();
  res.json({ success: true, data });
}

export async function auditLogs(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const query = listAuditLogsQuerySchema.parse(req.query);
  const data = await adminService.getAuditLogs(query);
  res.json({ success: true, data });
}

export async function loginHistory(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const data = await adminService.getLoginHistory();
  res.json({ success: true, data });
}

export async function securitySettings(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const data = await adminService.getSecuritySettings();
  res.json({ success: true, data });
}
