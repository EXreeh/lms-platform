import type { Request, Response } from "express";
import rateLimit, { type Options } from "express-rate-limit";
import { env } from "../config/env.js";
import { logAuthEvent } from "../utils/auth-log.js";

export const RATE_LIMIT_MESSAGE = "Too many attempts. Please wait a few minutes.";

function rateLimitBody(message: string = RATE_LIMIT_MESSAGE) {
  return {
    success: false,
    message,
    code: "RATE_LIMIT",
  };
}

function sendRateLimitResponse(res: Response, message: string = RATE_LIMIT_MESSAGE): void {
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

/** Paths with dedicated strict limiters — excluded from the general API cap. */
const SENSITIVE_AUTH_PATHS = new Set([
  "/auth/login",
  "/auth/logout",
  "/auth/register/request-otp",
  "/auth/register/resend-otp",
  "/auth/register/verify",
  "/auth/password/forgot",
  "/auth/password/resend-otp",
  "/auth/password/verify-otp",
  "/auth/password/reset",
  "/auth/check-email",
]);

/** Session routes — never capped by the general write limiter. */
const SESSION_AUTH_PATHS = new Set(["/auth/logout", "/auth/profile", "/auth/password/change"]);

function shouldSkipGeneralLimiter(req: Request): boolean {
  if (isReadOnlyRequest(req)) return true;
  if (req.path === "/health") return true;
  if (SENSITIVE_AUTH_PATHS.has(req.path)) return true;
  if (SESSION_AUTH_PATHS.has(req.path)) return true;
  return false;
}

function logRateLimitHit(req: Request, limiter: string): void {
  logAuthEvent("rate-limit", {
    limiter,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
}

function emailFromBody(req: Request): string {
  const email = req.body?.email;
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

/**
 * Broad safety net for mutating API calls.
 * GET routes (/auth/me, /dashboard/*, /courses, /messages/unread-count, etc.) are never limited.
 */
export const generalApiRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skip: shouldSkipGeneralLimiter,
  handler: (_req, res) => {
    sendRateLimitResponse(res);
  },
});

/** Login — 20 attempts per 15 minutes per IP. */
export const loginRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 20,
  handler: (_req, res) => {
    sendRateLimitResponse(res);
  },
});

/**
 * OTP / register / password-reset — 5 attempts per 10 minutes per email + IP.
 */
export const otpRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `${req.ip}:${emailFromBody(req)}`,
  handler: (req, res) => {
    logRateLimitHit(req, "otp");
    sendRateLimitResponse(res);
  },
});

/** Email availability during registration — moderate, separate from OTP. */
export const checkEmailRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => {
    const email =
      typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";
    return `${req.ip}:${email}`;
  },
  handler: (req, res) => {
    logRateLimitHit(req, "check-email");
    sendRateLimitResponse(res);
  },
});

/** Upload APIs — 30 uploads per 15 minutes per user/IP. */
export const uploadRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => `${req.ip}:${req.user?.id ?? "anon"}`,
  handler: (req, res) => {
    logRateLimitHit(req, "upload");
    sendRateLimitResponse(res, "Too many uploads. Please wait before trying again.");
  },
});

/** Live class join — 60 per 15 minutes per user. */
export const liveClassJoinRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyGenerator: (req) => `${req.ip}:${req.user?.id ?? "anon"}`,
  handler: (req, res) => {
    logRateLimitHit(req, "live-class-join");
    sendRateLimitResponse(res);
  },
});

/** Fee payment order creation — 20 per 15 minutes per user. */
export const feePaymentOrderRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => `${req.ip}:${req.user?.id ?? "anon"}`,
  handler: (req, res) => {
    logRateLimitHit(req, "fee-payment-order");
    sendRateLimitResponse(res, "Too many payment attempts. Please wait before trying again.");
  },
});

/** Fee payment verification — 30 per 15 minutes per user. */
export const feePaymentVerifyRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => `${req.ip}:${req.user?.id ?? "anon"}`,
  handler: (req, res) => {
    logRateLimitHit(req, "fee-payment-verify");
    sendRateLimitResponse(res, "Too many verification attempts. Please wait before trying again.");
  },
});

/** Recording access — 120 per 15 minutes per user. */
export const recordingAccessRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 120,
  keyGenerator: (req) => `${req.ip}:${req.user?.id ?? "anon"}`,
  handler: (req, res) => {
    logRateLimitHit(req, "recording-access");
    sendRateLimitResponse(res);
  },
});

/** @deprecated Use generalApiRateLimiter */
export const generalWriteRateLimiter = generalApiRateLimiter;
