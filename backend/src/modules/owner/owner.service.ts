import type { Role } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { env } from "../../config/env.js";
import { listAuditLogs } from "../audit/audit.service.js";
import * as adminService from "../admin/admin.service.js";
import { canCreateAdmin, canModifyTargetUser } from "../../utils/roles.js";
import type {
  ChangeRoleInput,
  CreateAdminInput,
  CreateStudentInput,
  CreateTeacherInput,
  ListUsersQuery,
  ResetPasswordInput,
  SuspendUserInput,
} from "../admin/admin.validation.js";

export async function listAllUsers(query: ListUsersQuery) {
  return adminService.listUsers(query);
}

export async function listAdmins() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "OWNER"] } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      suspended: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return users.map((u) => ({
    ...u,
    name: `${u.firstName} ${u.lastName}`.trim(),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function createAdminAsOwner(actorId: string, input: CreateAdminInput) {
  const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { role: true } });
  if (!actor || !canCreateAdmin(actor.role)) {
    throw ApiError.forbidden("Admin access required to create admin accounts");
  }
  return adminService.createAdmin(actorId, input);
}

export async function ownerChangeRole(actorId: string, userId: string, input: ChangeRoleInput) {
  const [actor, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: actorId }, select: { role: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ]);
  if (!actor || !canCreateAdmin(actor.role)) throw ApiError.forbidden("Admin access required");
  if (!target) throw ApiError.notFound("User not found");
  return adminService.changeUserRole(actorId, userId, input);
}

export async function ownerSuspend(actorId: string, userId: string, input: SuspendUserInput) {
  const [actor, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: actorId }, select: { role: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ]);
  if (!actor || !canCreateAdmin(actor.role)) throw ApiError.forbidden("Owner access required");
  if (!target) throw ApiError.notFound("User not found");
  if (!canModifyTargetUser(actor.role, target.role)) {
    throw ApiError.forbidden("You cannot modify this user");
  }
  return adminService.suspendUser(actorId, userId, input);
}

export async function ownerResetPassword(actorId: string, userId: string, input: ResetPasswordInput) {
  const [actor, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: actorId }, select: { role: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ]);
  if (!actor || !canCreateAdmin(actor.role)) throw ApiError.forbidden("Owner access required");
  if (!target) throw ApiError.notFound("User not found");
  if (!canModifyTargetUser(actor.role, target.role)) {
    throw ApiError.forbidden("You cannot reset this user's password");
  }
  return adminService.resetUserPassword(actorId, userId, input);
}

export async function getAuditLogs(query: Parameters<typeof listAuditLogs>[0]) {
  return listAuditLogs(query);
}

export async function getSecuritySettings() {
  return {
    nodeEnv: env.NODE_ENV,
    storageProvider: env.STORAGE_PROVIDER,
    corsOriginsConfigured: Boolean(env.ALLOWED_ORIGINS?.trim()),
    jwtConfigured: Boolean(env.JWT_SECRET?.length >= 32),
    r2Configured: env.STORAGE_PROVIDER === "r2",
    emailProvider: env.EMAIL_PROVIDER,
    rateLimitingEnabled: true,
    cookieSecure: env.NODE_ENV === "production",
    demoSeedDisabled: env.NODE_ENV === "production" || process.env.SEED_DEMO_DATA !== "true",
  };
}

export async function getLoginHistory(limit = 50) {
  const logs = await prisma.auditLog.findMany({
    where: { action: { in: ["USER_LOGIN", "USER_LOGIN_FAILED"] } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
    },
  });
  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    actor: l.actor,
    ipAddress: l.ipAddress,
    userAgent: l.userAgent,
    metadata: l.metadata,
    createdAt: l.createdAt.toISOString(),
  }));
}

export async function createUserAsOwner(
  actorId: string,
  role: Role,
  input: CreateStudentInput | CreateTeacherInput | CreateAdminInput,
) {
  if (role === "ADMIN") return createAdminAsOwner(actorId, input as CreateAdminInput);
  if (role === "TEACHER") return adminService.createTeacher(actorId, input as CreateTeacherInput);
  if (role === "STUDENT") return adminService.createStudent(actorId, input as CreateStudentInput);
  throw ApiError.badRequest("Invalid role");
}
