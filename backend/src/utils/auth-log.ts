import { env } from "../config/env.js";

const verbose =
  env.NODE_ENV !== "production" || process.env.AUTH_DEBUG === "true";

export function logAuthEvent(event: string, detail?: Record<string, unknown>): void {
  if (!verbose) return;
  console.info(`[Auth] ${event}`, detail ?? "");
}
