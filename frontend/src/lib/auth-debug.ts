/** Logs only in development or when NEXT_PUBLIC_AUTH_DEBUG=true */
const verbose =
  process.env.NEXT_PUBLIC_AUTH_DEBUG === "true" ||
  process.env.NODE_ENV === "development";

/** Always logged in production for auth lifecycle diagnostics */
const PROD_AUTH_EVENTS = new Set([
  "check:started",
  "check:success",
  "check:fail",
  "check:timeout",
  "route:public",
  "route:protected",
  "me:timeout",
]);

export function logAuth(event: string, detail?: Record<string, unknown>): void {
  if (!verbose && !PROD_AUTH_EVENTS.has(event)) return;
  console.info(`[Auth] ${event}`, detail ?? "");
}

export function logAuthError(event: string, detail?: Record<string, unknown>): void {
  if (!verbose && !PROD_AUTH_EVENTS.has(event)) return;
  console.error(`[Auth] ${event}`, detail ?? "");
}
