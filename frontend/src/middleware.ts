import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/constants";
import { parseJwtPayload, isTokenExpired } from "@/lib/jwt";
import { DASHBOARD_PATHS, displayRole, type AppRole, type Role } from "@/types/auth";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];
const PUBLIC_EXACT = ["/", "/login", "/register", "/forgot-password"];
const VALID_ROLES: Role[] = ["STUDENT", "TEACHER", "ADMIN", "OWNER"];

function isPublicCatalogPath(pathname: string): boolean {
  if (pathname === "/courses") return true;
  return /^\/courses\/[^/]+$/.test(pathname);
}

function isProtectedCoursePath(pathname: string): boolean {
  if (pathname.startsWith("/api")) return false;
  return (
    /^\/courses\/[^/]+\/learn(\/|$)/.test(pathname) ||
    /^\/courses\/[^/]+\/quizzes(\/|$)/.test(pathname) ||
    /^\/courses\/[^/]+\/certificate(\/|$)/.test(pathname)
  );
}

function getRoleDashboard(role: Role): string {
  return DASHBOARD_PATHS[role];
}

function isTokenValid(token: string | undefined): { valid: boolean; role?: Role } {
  if (!token) return { valid: false };
  const payload = parseJwtPayload(token);
  if (!payload || isTokenExpired(token)) return { valid: false };
  if (!VALID_ROLES.includes(payload.role)) return { valid: false };
  return { valid: true, role: payload.role };
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  loginUrl.searchParams.set("session", "expired");
  const res = NextResponse.redirect(loginUrl);
  res.cookies.delete(TOKEN_COOKIE);
  return res;
}

function redirectOwnerPath(pathname: string, request: NextRequest): NextResponse | null {
  if (!pathname.startsWith("/dashboard/owner")) return null;

  if (pathname.startsWith("/dashboard/owner/audit-logs")) {
    return NextResponse.redirect(new URL("/dashboard/admin/audit-logs", request.url));
  }
  if (pathname.startsWith("/dashboard/owner/security")) {
    return NextResponse.redirect(new URL("/dashboard/admin/security", request.url));
  }
  if (pathname.startsWith("/dashboard/owner/users")) {
    return NextResponse.redirect(new URL("/dashboard/admin/users", request.url));
  }
  if (pathname.startsWith("/dashboard/owner/admins")) {
    return NextResponse.redirect(new URL("/dashboard/admin/users?role=ADMIN", request.url));
  }
  return NextResponse.redirect(new URL("/dashboard/admin", request.url));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ownerRedirect = redirectOwnerPath(pathname, request);
  if (ownerRedirect) return ownerRedirect;

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const { valid: tokenValid, role } = isTokenValid(token);

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isDashboard = pathname.startsWith("/dashboard");
  const isPublic =
    PUBLIC_EXACT.includes(pathname) || isPublicCatalogPath(pathname);

  if (isDashboard) {
    if (!tokenValid || !role) {
      return redirectToLogin(request, pathname);
    }

    const appRole = displayRole(role);
    const roleBase: Record<AppRole, string> = {
      STUDENT: "/dashboard/student",
      TEACHER: "/dashboard/teacher",
      ADMIN: "/dashboard/admin",
    };
    const allowedBase = roleBase[appRole];
    const isInstituteAdmin = appRole === "ADMIN";
    const canAccess =
      pathname.startsWith("/dashboard/profile") ||
      pathname.startsWith(allowedBase) ||
      (isInstituteAdmin &&
        (pathname.startsWith("/dashboard/teacher") ||
          pathname.startsWith("/dashboard/admin")));

    if (!canAccess) {
      return NextResponse.redirect(new URL(getRoleDashboard(role), request.url));
    }
  }

  if (isProtectedCoursePath(pathname)) {
    if (!tokenValid || !role) {
      return redirectToLogin(request, pathname);
    }
    if (pathname.includes("/quizzes/") && role !== "STUDENT") {
      return NextResponse.redirect(new URL(getRoleDashboard(role), request.url));
    }
  }

  if (isAuthRoute && tokenValid && role) {
    return NextResponse.redirect(new URL(getRoleDashboard(role), request.url));
  }

  if (!isPublic && !isDashboard && !isAuthRoute && !isProtectedCoursePath(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\..*).*)"],
};
