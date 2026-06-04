/** Logs only in development or when NEXT_PUBLIC_AUTH_DEBUG=true */
const verbose =
  process.env.NEXT_PUBLIC_AUTH_DEBUG === "true" ||
  process.env.NODE_ENV === "development";

export function logAuth(event: string, detail?: Record<string, unknown>): void {
  if (!verbose) return;
  console.info(`[Auth] ${event}`, detail ?? "");
}

export function logAuthError(event: string, detail?: Record<string, unknown>): void {
  if (!verbose) return;
  console.error(`[Auth] ${event}`, detail ?? "");
}
