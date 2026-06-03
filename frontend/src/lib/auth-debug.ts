/** Verbose auth logs — set NEXT_PUBLIC_AUTH_DEBUG=true on Vercel for production debugging */
const verbose =
  process.env.NEXT_PUBLIC_AUTH_DEBUG === "true" ||
  process.env.NODE_ENV === "development";

export function logAuth(event: string, detail?: Record<string, unknown>): void {
  if (!verbose) return;
  console.info(`[Auth] ${event}`, detail ?? "");
}

/** Always logged in the browser for failed auth API calls (including production). */
export function logAuthError(event: string, detail?: Record<string, unknown>): void {
  console.error(`[Auth] ${event}`, detail ?? "");
}
