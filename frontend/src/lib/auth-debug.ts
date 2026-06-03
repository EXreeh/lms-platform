/** Temporary auth network logging — enable with NEXT_PUBLIC_AUTH_DEBUG=true */
const enabled =
  process.env.NEXT_PUBLIC_AUTH_DEBUG === "true" ||
  process.env.NODE_ENV === "development";

export function logAuth(event: string, detail?: Record<string, unknown>): void {
  if (!enabled) return;
  console.info(`[Auth] ${event}`, detail ?? "");
}
