"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { isProtectedPath } from "@/lib/auth-session";

/**
 * Redirects away from protected routes when the session is invalid
 * (e.g. after a database reset while a stale JWT cookie existed).
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user && isProtectedPath(pathname)) {
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}&session=expired`;
      router.replace(loginUrl);
    }
  }, [isLoading, user, pathname, router]);

  return <>{children}</>;
}
