import type { Response } from "express";
import type { CookieOptions } from "express";
import { env } from "../config/env.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function cookieBaseOptions(): CookieOptions {
  const isProduction = env.NODE_ENV === "production";

  const secure = env.COOKIE_SECURE || isProduction;
  const sameSite: CookieOptions["sameSite"] = isProduction ? "none" : env.COOKIE_SAME_SITE;

  const options: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  };

  const domain = env.COOKIE_DOMAIN?.trim();
  if (domain) {
    options.domain = domain;
  }

  return options;
}

/** Safe summary for logs (no token values). */
export function cookieOptionsForLog(): Record<string, unknown> {
  const opts = cookieBaseOptions();
  return {
    name: env.JWT_COOKIE_NAME,
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    domain: opts.domain ?? "(host default)",
    maxAgeMs: SEVEN_DAYS_MS,
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(env.JWT_COOKIE_NAME, token, {
    ...cookieBaseOptions(),
    maxAge: SEVEN_DAYS_MS,
  });
}

export function clearAuthCookie(res: Response): void {
  const options = cookieBaseOptions();
  res.clearCookie(env.JWT_COOKIE_NAME, { ...options, maxAge: 0 });
}
