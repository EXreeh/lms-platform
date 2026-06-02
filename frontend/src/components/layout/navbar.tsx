"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuth } from "@/context/auth-context";
import { isValidRole } from "@/lib/auth-session";
import type { Role } from "@/types/auth";

interface NavLink {
  href: string;
  label: string;
  match?: (path: string) => boolean;
}

function isActive(pathname: string, link: NavLink): boolean {
  if (link.match) return link.match(pathname);
  if (link.href === "/") return pathname === "/";
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

const publicNav: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
];

const studentNav: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/dashboard/student", label: "Dashboard", match: (p) => p === "/dashboard/student" },
  { href: "/courses", label: "Courses" },
  {
    href: "/dashboard/student",
    label: "My Learning",
    match: (p) =>
      (p.startsWith("/courses/") && (p.includes("/learn") || p.includes("/quizzes"))) ||
      p.startsWith("/dashboard/student/payments"),
  },
  {
    href: "/dashboard/student/resources",
    label: "Resources",
    match: (p) => p.startsWith("/dashboard/student/resources"),
  },
  {
    href: "/dashboard/student/certificates",
    label: "Certificates",
    match: (p) =>
      p.includes("/certificate") || p.startsWith("/dashboard/student/certificates"),
  },
];

const teacherNav: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/dashboard/teacher", label: "Dashboard", match: (p) => p === "/dashboard/teacher" },
  {
    href: "/dashboard/teacher/courses",
    label: "My Courses",
    match: (p) =>
      p.startsWith("/dashboard/teacher/courses") && p !== "/dashboard/teacher/courses/new",
  },
  {
    href: "/dashboard/teacher/courses/new",
    label: "Create Course",
    match: (p) => p === "/dashboard/teacher/courses/new",
  },
  {
    href: "/dashboard/teacher/quizzes",
    label: "Quizzes",
    match: (p) => p.startsWith("/dashboard/teacher/quizzes"),
  },
  {
    href: "/dashboard/teacher/resources",
    label: "Resources",
    match: (p) => p.startsWith("/dashboard/teacher/resources"),
  },
  { href: "/courses", label: "Courses" },
];

const adminNav: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/dashboard/admin", label: "Dashboard", match: (p) => p === "/dashboard/admin" },
  {
    href: "/dashboard/admin/users",
    label: "Users",
    match: (p) => p.startsWith("/dashboard/admin/users"),
  },
  {
    href: "/dashboard/admin/courses",
    label: "Courses",
    match: (p) => p.startsWith("/dashboard/admin/courses"),
  },
  {
    href: "/dashboard/admin/review",
    label: "Review Queue",
    match: (p) => p.startsWith("/dashboard/admin/review"),
  },
  {
    href: "/dashboard/admin/resources",
    label: "Resources",
    match: (p) => p.startsWith("/dashboard/admin/resources"),
  },
  {
    href: "/dashboard/admin/activity",
    label: "Reports",
    match: (p) =>
      p.startsWith("/dashboard/admin/activity") ||
      p.startsWith("/dashboard/admin/payments") ||
      p.startsWith("/dashboard/admin/certificates"),
  },
];

function navForRole(role?: Role): NavLink[] {
  if (role === "STUDENT") return studentNav;
  if (role === "TEACHER") return teacherNav;
  if (role === "ADMIN") return adminNav;
  return publicNav;
}

function resolveNavLinks(user: ReturnType<typeof useAuth>["user"], isLoading: boolean): NavLink[] {
  if (isLoading) return publicNav;
  if (user && isValidRole(user.role)) return navForRole(user.role);
  return publicNav;
}

function NavLinkItem({
  link,
  pathname,
  onNavigate,
}: {
  link: NavLink;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isActive(pathname, link);
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-green-700/10 text-green-800 dark:bg-green-400/10 dark:text-green-300"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {link.label}
    </Link>
  );
}

function AuthActions({
  user,
  isLoading,
  pathname,
  logout,
  onNavigate,
  compact,
}: {
  user: ReturnType<typeof useAuth>["user"];
  isLoading: boolean;
  pathname: string;
  logout: () => Promise<void>;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  if (isLoading) {
    return (
      <span className="px-2 text-xs text-muted-foreground" aria-live="polite">
        Loading…
      </span>
    );
  }

  if (user && isValidRole(user.role)) {
    const profileActive = pathname.startsWith("/dashboard/profile");
    if (compact) {
      return (
        <>
          <Link href="/dashboard/profile" onClick={onNavigate}>
            <Button
              variant={profileActive ? "primary" : "secondary"}
              className="w-full"
            >
              Profile
            </Button>
          </Link>
          <Button variant="ghost" className="w-full" onClick={() => void logout()}>
            Logout
          </Button>
        </>
      );
    }

    return (
      <>
        <Link
          href="/dashboard/profile"
          className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            profileActive
              ? "bg-green-700/10 text-green-800 dark:bg-green-400/10 dark:text-green-300"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Profile
        </Link>
        <span className="hidden max-w-[9rem] truncate text-sm text-muted-foreground xl:inline">
          {user.name}
        </span>
        <Button variant="ghost" size="sm" onClick={() => void logout()}>
          Logout
        </Button>
      </>
    );
  }

  if (compact) {
    return (
      <>
        <Link href="/login" onClick={onNavigate}>
          <Button variant="secondary" className="w-full">
            Login
          </Button>
        </Link>
        <Link href="/register" onClick={onNavigate}>
          <Button variant="gold" className="w-full">
            Register
          </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Login
      </Link>
      <Link href="/register">
        <Button size="sm" variant="gold">
          Register
        </Button>
      </Link>
    </>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = resolveNavLinks(user, isLoading);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] w-full max-w-[1600px] items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Logo size="md" />

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto lg:flex"
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <NavLinkItem key={`${link.href}-${link.label}`} link={link} pathname={pathname} />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <div className="hidden items-center gap-1 sm:flex sm:gap-2">
            <AuthActions
              user={user}
              isLoading={isLoading}
              pathname={pathname}
              logout={logout}
            />
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border lg:hidden"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border lg:hidden"
          >
            <nav
              className="mx-auto flex max-w-[1600px] flex-col gap-1 px-4 py-4 sm:px-6"
              aria-label="Mobile navigation"
            >
              {links.map((link) => (
                <NavLinkItem
                  key={`mobile-${link.href}-${link.label}`}
                  link={link}
                  pathname={pathname}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                <AuthActions
                  user={user}
                  isLoading={isLoading}
                  pathname={pathname}
                  logout={logout}
                  onNavigate={() => setMobileOpen(false)}
                  compact
                />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
