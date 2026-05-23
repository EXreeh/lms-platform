import type { Request, Response, NextFunction } from "express";
import type { Role } from "@lms/database";
import { ApiError } from "../utils/api-error.js";

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
