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
import { useUnreadMessages, UnreadBadge } from "@/components/institute/unread-badge";

interface NavLink {
  href: string;
  label: string;
  match?: (path: string) => boolean;
  showUnreadBadge?: boolean;
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
  { href: "/dashboard/student", label: "Dashboard", match: (p) => p === "/dashboard/student" },
  {
    href: "/dashboard/student/courses",
    label: "My Courses",
    match: (p) =>
      p.startsWith("/dashboard/student/courses") ||
      (p.startsWith("/courses/") && (p.includes("/learn") || p.includes("/quizzes"))),
  },
  {
    href: "/dashboard/student/batch",
    label: "My Batch",
    match: (p) => p.startsWith("/dashboard/student/batch"),
  },
  {
    href: "/dashboard/student/fees",
    label: "My Fees",
    match: (p) => p.startsWith("/dashboard/student/fees"),
  },
  {
    href: "/dashboard/student/messages",
    label: "Messages",
    match: (p) => p.startsWith("/dashboard/student/messages"),
    showUnreadBadge: true,
  },
  {
    href: "/dashboard/student/live-classes",
    label: "Live Classes",
    match: (p) => p.startsWith("/dashboard/student/live-classes"),
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
  { href: "/dashboard/teacher", label: "Dashboard", match: (p) => p === "/dashboard/teacher" },
  {
    href: "/dashboard/teacher/batches",
    label: "My Batches",
    match: (p) => p.startsWith("/dashboard/teacher/batches"),
  },
  {
    href: "/dashboard/teacher/courses",
    label: "My Courses",
    match: (p) => p.startsWith("/dashboard/teacher/courses"),
  },
  {
    href: "/dashboard/teacher/batches",
    label: "Students",
    match: (p) => p.startsWith("/dashboard/teacher/batches"),
  },
  {
    href: "/dashboard/teacher/messages",
    label: "Messages",
    match: (p) => p.startsWith("/dashboard/teacher/messages"),
    showUnreadBadge: true,
  },
  {
    href: "/dashboard/teacher/salary",
    label: "My Salary",
    match: (p) => p.startsWith("/dashboard/teacher/salary"),
  },
  {
    href: "/dashboard/teacher/live-classes",
    label: "Live Classes",
    match: (p) => p.startsWith("/dashboard/teacher/live-classes"),
  },
];

const adminNav: NavLink[] = [
  { href: "/dashboard/admin", label: "Dashboard", match: (p) => p === "/dashboard/admin" },
  {
    href: "/dashboard/admin/users",
    label: "Students",
    match: (p) => p.startsWith("/dashboard/admin/users"),
  },
  {
    href: "/dashboard/admin/users",
    label: "Teachers",
    match: (p) => p.startsWith("/dashboard/admin/users"),
  },
  {
    href: "/dashboard/admin/courses",
    label: "Courses",
    match: (p) => p.startsWith("/dashboard/admin/courses"),
  },
  {
    href: "/dashboard/admin/batches",
    label: "Batches",
    match: (p) => p.startsWith("/dashboard/admin/batches"),
  },
  {
    href: "/dashboard/admin/fees",
    label: "Fees",
    match: (p) => p.startsWith("/dashboard/admin/fees"),
  },
  {
    href: "/dashboard/admin/course-access",
    label: "Access",
    match: (p) => p.startsWith("/dashboard/admin/course-access"),
  },
  {
    href: "/dashboard/admin/messages",
    label: "Messages",
    match: (p) => p.startsWith("/dashboard/admin/messages"),
    showUnreadBadge: true,
  },
  {
    href: "/dashboard/admin/teacher-salaries",
    label: "Teacher Salaries",
    match: (p) => p.startsWith("/dashboard/admin/teacher-salaries"),
  },
  {
    href: "/dashboard/admin/live-classes",
    label: "Live Classes",
    match: (p) => p.startsWith("/dashboard/admin/live-classes"),
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

function resolveNavLinks(
  user: ReturnType<typeof useAuth>["user"],
  isLoggingOut: boolean,
  isAuthenticated: boolean,
): NavLink[] {
  if (isLoggingOut || !isAuthenticated || !user) return publicNav;
  if (isValidRole(user.role)) return navForRole(user.role);
  return publicNav;
}

function NavLinkItem({
  link,
  pathname,
  onNavigate,
  unreadCount,
}: {
  link: NavLink;
  pathname: string;
  onNavigate?: () => void;
  unreadCount: number;
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
      {link.showUnreadBadge ? <UnreadBadge count={unreadCount} /> : null}
    </Link>
  );
}

function AuthActions({
  user,
  isLoggingOut,
  isAuthenticated,
  pathname,
  logout,
  onNavigate,
  compact,
}: {
  user: ReturnType<typeof useAuth>["user"];
  isLoggingOut: boolean;
  isAuthenticated: boolean;
  pathname: string;
  logout: () => void;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  if (isLoggingOut || !isAuthenticated || !user) {
    if (compact) {
      return (
        <Link href="/login" onClick={onNavigate}>
          <Button variant="gold" className="w-full">
            Sign in
          </Button>
        </Link>
      );
    }
    return (
      <Link href="/login">
        <Button size="sm" variant="gold">
          Sign in
        </Button>
      </Link>
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
          <Button variant="ghost" className="w-full" onClick={logout}>
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
        <Button variant="ghost" size="sm" onClick={logout}>
          Logout
        </Button>
      </>
    );
  }

  if (compact) {
    return (
      <Link href="/login" onClick={onNavigate}>
        <Button variant="gold" className="w-full">
          Sign in
        </Button>
      </Link>
    );
  }

  return (
    <Link href="/login">
      <Button size="sm" variant="gold">
        Sign in
      </Button>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isLoggingOut, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const unreadCount = useUnreadMessages();

  const links = resolveNavLinks(user, isLoggingOut, isAuthenticated);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] w-full max-w-[1600px] items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Logo size="md" />

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto lg:flex"
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <NavLinkItem
              key={`${link.href}-${link.label}`}
              link={link}
              pathname={pathname}
              unreadCount={unreadCount}
            />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <div className="hidden items-center gap-1 sm:flex sm:gap-2">
            <AuthActions
              user={user}
              isLoggingOut={isLoggingOut}
              isAuthenticated={isAuthenticated}
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
                  unreadCount={unreadCount}
                />
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                <AuthActions
                  user={user}
                  isLoggingOut={isLoggingOut}
                  isAuthenticated={isAuthenticated}
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
