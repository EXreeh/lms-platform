import type { Request, Response } from "express";
import rateLimit, { type Options } from "express-rate-limit";
import { env } from "../config/env.js";

function rateLimitBody(message: string) {
  return {
    success: false,
    message,
    code: "RATE_LIMIT",
  };
}

function sendRateLimitResponse(res: Response, message: string): void {
  res.status(429).json(rateLimitBody(message));
}

const baseOptions: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: env.NODE_ENV === "production" },
};

function isReadOnlyRequest(req: Request): boolean {
  return req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS";
}

/** Applies to mutating API calls only — GET routes (courses, /me, dashboard, etc.) are excluded. */
export const generalWriteRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 400,
  skip: (req) => isReadOnlyRequest(req) || req.path === "/health",
  handler: (_req, res) => {
    sendRateLimitResponse(
      res,
      "You're making requests too quickly. Please wait a moment and try again.",
    );
  },
});

/** Login attempts — reasonable cap without blocking normal retries. */
export const loginRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 30,
  handler: (_req, res) => {
    sendRateLimitResponse(
      res,
      "Too many login attempts. Please wait a few minutes and try again.",
    );
  },
});

/** OTP send / verify / password reset — keep strict. */
export const otpRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 12,
  handler: (_req, res) => {
    sendRateLimitResponse(
      res,
      "Too many verification attempts. Please wait before requesting another code.",
    );
  },
});

/** Email availability checks during registration. */
export const checkEmailRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: 40,
  handler: (_req, res) => {
    sendRateLimitResponse(res, "Too many email checks. Please slow down.");
  },
});
