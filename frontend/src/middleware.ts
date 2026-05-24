import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/constants";
import { parseJwtPayload } from "@/lib/jwt";
import { DASHBOARD_PATHS, type Role } from "@/types/auth";

const AUTH_ROUTES = ["/login", "/register"];
const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password"];

function getRoleDashboard(role: Role): string {
  return DASHBOARD_PATHS[role];
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const payload = token ? parseJwtPayload(token) : null;

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isDashboard = pathname.startsWith("/dashboard");
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  if (isDashboard) {
    if (!token || !payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const expectedPath = getRoleDashboard(payload.role);
    if (pathname !== expectedPath) {
      return NextResponse.redirect(new URL(expectedPath, request.url));
    }
  }

  if (isAuthRoute && token && payload) {
    return NextResponse.redirect(new URL(getRoleDashboard(payload.role), request.url));
  }

  if (!isPublic && !isDashboard && !isAuthRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
