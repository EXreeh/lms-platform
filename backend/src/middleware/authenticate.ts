import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { prisma } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";
import { verifyToken } from "../utils/jwt.js";

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  const cookieToken = req.cookies?.[env.JWT_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  return null;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    next(ApiError.unauthorized("Authentication required"));
    return;
  }

  void (async () => {
    try {
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, suspended: true },
      });

      if (!user) {
        next(ApiError.unauthorized("Invalid or expired token"));
        return;
      }

      if (user.suspended) {
        next(ApiError.forbidden("Your account has been suspended"));
        return;
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      next();
    } catch {
      next(ApiError.unauthorized("Invalid or expired token"));
    }
  })();
}
