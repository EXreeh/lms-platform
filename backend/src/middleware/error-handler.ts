import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/api-error.js";
import { logPrismaRouteError } from "../utils/prisma-safe.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const route = `${req.method} ${req.originalUrl}`;
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code ?? inferErrorCode(err.statusCode),
      message: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    const detail = Object.entries(fieldErrors)
      .flatMap(([field, messages]) => (messages ?? []).map((m) => `${field}: ${m}`))
      .join("; ");
    res.status(400).json({
      success: false,
      message: detail || "Validation failed",
      errors: fieldErrors,
    });
    return;
  }

  logPrismaRouteError(route, err);
  console.error(`[API] ${route} 500`, err);
  res.status(500).json({
    success: false,
    code: "STORAGE_ERROR",
    message: process.env.NODE_ENV === "production" ? "Internal server error" : String(err),
  });
}

function inferErrorCode(statusCode: number): string | undefined {
  if (statusCode === 401) return "UNAUTHORIZED";
  if (statusCode === 403) return "FORBIDDEN";
  if (statusCode === 413) return "FILE_TOO_LARGE";
  if (statusCode >= 500) return "STORAGE_ERROR";
  return undefined;
}
