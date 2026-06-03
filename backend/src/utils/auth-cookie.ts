import type { Response } from "express";
import type { CookieOptions } from "express";
import { env } from "../config/env.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function cookieBaseOptions(): CookieOptions {
  const isProduction = env.NODE_ENV === "production";

  const secure = env.COOKIE_SECURE || isProduction;
  const sameSite: CookieOptions["sameSite"] = isProduction ? "none" : env.COOKIE_SAME_SITE;

  const options: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  };

  if (env.COOKIE_DOMAIN?.trim()) {
    options.domain = env.COOKIE_DOMAIN.trim();
  }

  return options;
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
