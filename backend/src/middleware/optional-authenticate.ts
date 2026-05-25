import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
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

/** Attach user when a valid token is present; continue anonymously otherwise. */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // Invalid token — treat as anonymous for public routes
  }

  next();
}
