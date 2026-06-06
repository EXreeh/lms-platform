"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { isProtectedPath, isValidRole } from "@/lib/auth-session";
import { isPublicAuthPath } from "@/lib/auth-routes";
import {
  dashboardPathForRole,
  isDashboardRoleMismatch,
} from "@/lib/auth-role-route";
import { AuthLoading } from "@/components/auth/auth-loading";

/**
 * Redirects away from protected routes when the session is invalid.
 * Public auth routes render immediately without waiting for /me.
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, authDegraded } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isProtected = isProtectedPath(pathname);
  const isPublic = isPublicAuthPath(pathname);

  useEffect(() => {
    if (isPublic) return;
    if (isLoading) return;
    if (!user && isProtected) {
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}&session=expired`;
      router.replace(loginUrl);
      return;
    }
    if (user && isValidRole(user.role) && isDashboardRoleMismatch(pathname, user.role)) {
      router.replace(dashboardPathForRole(user.role));
      router.refresh();
    }
  }, [isLoading, user, pathname, router, isProtected, isPublic]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (isProtected && isLoading) {
    return (
      <AuthLoading
        slowMessage={
          authDegraded
            ? "Server is taking longer than usual. Please try again."
            : undefined
        }
      />
    );
  }

  return (
    <>
      {authDegraded && isProtected && !user ? (
        <div
          className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
          role="status"
        >
          Server is taking longer than usual. Please try again.
        </div>
      ) : null}
      {children}
    </>
  );
}
