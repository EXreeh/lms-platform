import type { Response } from "express";
import { env } from "../config/env.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function cookieBaseOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: "/",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(env.JWT_COOKIE_NAME, token, {
    ...cookieBaseOptions(),
    maxAge: SEVEN_DAYS_MS,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(env.JWT_COOKIE_NAME, cookieBaseOptions());
}
