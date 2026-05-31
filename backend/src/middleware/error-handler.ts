import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/api-error.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
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

  console.error(err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : String(err),
  });
}
