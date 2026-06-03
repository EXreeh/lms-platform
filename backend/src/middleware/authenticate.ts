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
  const viaBearer = Boolean(req.headers.authorization?.startsWith("Bearer "));
  const viaCookie = Boolean(req.cookies?.[env.JWT_COOKIE_NAME]);

  if (!token) {
    console.warn(
      `[Auth] /me unauthorized — no token (cookie=${viaCookie}, bearer=${viaBearer}, cookieName=${env.JWT_COOKIE_NAME})`,
    );
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
        console.warn(`[Auth] /me unauthorized — user not found (${payload.sub})`);
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
    } catch (error) {
      const reason = error instanceof Error ? error.message : "token verify failed";
      console.warn(`[Auth] /me unauthorized — ${reason} (bearer=${viaBearer}, cookie=${viaCookie})`);
      next(ApiError.unauthorized("Invalid or expired token"));
    }
  })();
}
