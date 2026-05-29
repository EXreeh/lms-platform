import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/constants";
import { parseJwtPayload, isTokenExpired } from "@/lib/jwt";
import { DASHBOARD_PATHS, type Role } from "@/types/auth";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];
const PUBLIC_EXACT = ["/", "/login", "/register", "/forgot-password"];

function isPublicCatalogPath(pathname: string): boolean {
  if (pathname === "/courses") return true;
  // /courses/[slug] only — not /learn or /quizzes
  return /^\/courses\/[^/]+$/.test(pathname);
}

function isProtectedCoursePath(pathname: string): boolean {
  return (
    pathname.includes("/learn") ||
    pathname.includes("/quizzes/")
  );
}

function getRoleDashboard(role: Role): string {
  return DASHBOARD_PATHS[role];
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  const res = NextResponse.redirect(loginUrl);
  res.cookies.delete(TOKEN_COOKIE);
  return res;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const payload = token ? parseJwtPayload(token) : null;
  const tokenValid = Boolean(token && payload && !isTokenExpired(token));

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isDashboard = pathname.startsWith("/dashboard");
  const isPublic =
    PUBLIC_EXACT.includes(pathname) || isPublicCatalogPath(pathname);

  if (isDashboard) {
    if (!tokenValid) {
      return redirectToLogin(request, pathname);
    }

    const roleBase: Record<Role, string> = {
      STUDENT: "/dashboard/student",
      TEACHER: "/dashboard/teacher",
      ADMIN: "/dashboard/admin",
    };
    const allowedBase = roleBase[payload!.role];
    const canAccess =
      pathname.startsWith(allowedBase) ||
      (payload!.role === "ADMIN" &&
        (pathname.startsWith("/dashboard/teacher") || pathname.startsWith("/dashboard/admin")));

    if (!canAccess) {
      return NextResponse.redirect(new URL(getRoleDashboard(payload!.role), request.url));
    }
  }

  if (isProtectedCoursePath(pathname)) {
    if (!tokenValid) {
      return redirectToLogin(request, pathname);
    }
    if (pathname.includes("/quizzes/") && payload!.role !== "STUDENT") {
      return NextResponse.redirect(new URL(getRoleDashboard(payload!.role), request.url));
    }
  }

  if (isAuthRoute && tokenValid) {
    return NextResponse.redirect(new URL(getRoleDashboard(payload!.role), request.url));
  }

  if (!isPublic && !isDashboard && !isAuthRoute && !isProtectedCoursePath(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
