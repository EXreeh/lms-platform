import type { Role } from "@lms/database";
import type { Request } from "express";
import { prisma } from "../../config/database.js";

export type AuditAction =
  | "USER_LOGIN"
  | "USER_LOGIN_FAILED"
  | "USER_CREATED"
  | "USER_ROLE_CHANGED"
  | "USER_SUSPENDED"
  | "USER_ENABLED"
  | "USER_PASSWORD_RESET"
  | "USER_DELETED"
  | "COURSE_CREATED"
  | "COURSE_DELETED"
  | "COURSE_ARCHIVED"
  | "BATCH_CREATED"
  | "BATCH_STUDENT_ASSIGNED"
  | "LIVE_CLASS_CREATED"
  | "RECORDING_UPLOADED"
  | "FEE_UPDATED"
  | "SALARY_UPDATED"
  | "ADMIN_ACTION"
  | "SECURITY_SETTINGS_VIEWED";

export interface AuditLogInput {
  actorId?: string | null;
  actorRole?: Role | null;
  action: AuditAction | string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export function auditContextFromRequest(req: Request): Pick<AuditLogInput, "ipAddress" | "userAgent"> {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    typeof forwarded === "string"
      ? forwarded.split(",")[0]?.trim()
      : req.ip ?? req.socket.remoteAddress ?? null;
  const userAgent = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : null;
  return { ipAddress: ip, userAgent };
}

export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write audit log", {
      action: input.action,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function logAuditFromRequest(
  req: Request,
  input: Omit<AuditLogInput, "ipAddress" | "userAgent" | "actorId" | "actorRole"> & {
    actorId?: string | null;
    actorRole?: Role | null;
  },
): Promise<void> {
  const ctx = auditContextFromRequest(req);
  await logAudit({
    actorId: input.actorId ?? req.user?.id ?? null,
    actorRole: input.actorRole ?? req.user?.role ?? null,
    ...input,
    ...ctx,
  });
}

export async function listAuditLogs(query: {
  page?: number;
  limit?: number;
  action?: string;
  actorId?: string;
  entityType?: string;
  from?: string;
  to?: string;
}) {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 50, 100);
  const skip = (page - 1) * limit;

  const where: {
    action?: string;
    actorId?: string;
    entityType?: string;
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  if (query.action) where.action = query.action;
  if (query.actorId) where.actorId = query.actorId;
  if (query.entityType) where.entityType = query.entityType;
  if (query.from || query.to) {
    where.createdAt = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    };
  }

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: rows.map((row) => ({
      id: row.id,
      action: row.action,
      actorId: row.actorId,
      actorRole: row.actorRole,
      actor: row.actor
        ? {
            id: row.actor.id,
            name: `${row.actor.firstName} ${row.actor.lastName}`.trim(),
            email: row.actor.email,
            role: row.actor.role,
          }
        : null,
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: row.metadata,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: row.createdAt.toISOString(),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
