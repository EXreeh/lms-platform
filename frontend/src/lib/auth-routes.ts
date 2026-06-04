import { isProtectedPath } from "@/lib/auth-session";

/** Routes that must render immediately without waiting for /auth/me */
const PUBLIC_AUTH_EXACT = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/verify",
]);

const PUBLIC_AUTH_PREFIXES = ["/verify/"];

export function isPublicAuthPath(pathname: string): boolean {
  if (PUBLIC_AUTH_EXACT.has(pathname)) return true;
  return PUBLIC_AUTH_PREFIXES.some((p) => pathname.startsWith(p));
}

export function getRouteAuthKind(pathname: string): "public" | "protected" {
  if (isPublicAuthPath(pathname)) return "public";
  if (isProtectedPath(pathname)) return "protected";
  return "public";
}
