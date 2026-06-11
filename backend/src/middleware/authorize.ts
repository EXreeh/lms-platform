import type { Request, Response, NextFunction } from "express";
import type { Role } from "@lms/database";
import { ApiError } from "../utils/api-error.js";
import { canAccessAdminPanel, isAdminRole } from "../utils/roles.js";

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(ApiError.forbidden("Insufficient permissions"));
      return;
    }

    next();
  };
}

/** Institute admin APIs — ADMIN and legacy OWNER. */
export function authorizeAdmin() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!canAccessAdminPanel(req.user.role)) {
      next(ApiError.forbidden("Admin access required"));
      return;
    }
    next();
  };
}

/** Teacher panel — teacher plus institute admins (including legacy OWNER). */
export function authorizeTeacherPanel() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (req.user.role === "TEACHER" || isAdminRole(req.user.role)) {
      next();
      return;
    }
    next(ApiError.forbidden("Insufficient permissions"));
  };
}

/** Student-only APIs. */
export function authorizeStudent() {
  return authorize("STUDENT");
}

export function requireAdminUser(req: Request): void {
  if (!req.user || !isAdminRole(req.user.role)) {
    throw ApiError.forbidden("Admin access required");
  }
}
