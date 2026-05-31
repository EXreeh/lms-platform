"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  match?: (pathname: string) => boolean;
}

const teacherNav: NavItem[] = [
  {
    href: "/dashboard/teacher",
    label: "Overview",
    icon: "◈",
    match: (p) => p === "/dashboard/teacher",
  },
  {
    href: "/dashboard/teacher",
    label: "My courses",
    icon: "📚",
    match: (p) => p.startsWith("/dashboard/teacher/courses"),
  },
  { href: "/courses", label: "Marketplace", icon: "◎" },
  {
    href: "/dashboard/teacher/quizzes",
    label: "Quizzes",
    icon: "?",
    match: (p) => p.startsWith("/dashboard/teacher/quizzes"),
  },
  {
    href: "/dashboard/teacher/resources",
    label: "Resources",
    icon: "📎",
    match: (p) => p.startsWith("/dashboard/teacher/resources"),
  },
  {
    href: "/dashboard/teacher/courses/new",
    label: "Create course",
    icon: "＋",
    match: (p) => p === "/dashboard/teacher/courses/new",
  },
  { href: "/courses", label: "Catalog", icon: "◎" },
];

const studentNav: NavItem[] = [
  {
    href: "/dashboard/student",
    label: "Dashboard",
    icon: "◈",
    match: (p) => p === "/dashboard/student",
  },
  { href: "/courses", label: "Browse courses", icon: "◎" },
  {
    href: "/dashboard/student/certificates",
    label: "Certificates",
    icon: "🏆",
    match: (p) => p.startsWith("/dashboard/student/certificates") || p.includes("/certificate"),
  },
  {
    href: "/dashboard/student/payments",
    label: "Payments",
    icon: "💳",
    match: (p) => p.startsWith("/dashboard/student/payments"),
  },
];

const adminNav: NavItem[] = [
  {
    href: "/dashboard/admin",
    label: "Overview",
    icon: "◈",
    match: (p) => p === "/dashboard/admin",
  },
  {
    href: "/dashboard/admin/review",
    label: "Review",
    icon: "✓",
    match: (p) => p.startsWith("/dashboard/admin/review"),
  },
  {
    href: "/dashboard/admin/users",
    label: "Users",
    icon: "👥",
    match: (p) => p.startsWith("/dashboard/admin/users"),
  },
  {
    href: "/dashboard/admin/courses",
    label: "Courses",
    icon: "📚",
    match: (p) => p.startsWith("/dashboard/admin/courses"),
  },
  {
    href: "/dashboard/admin/activity",
    label: "Activity",
    icon: "◎",
    match: (p) => p.startsWith("/dashboard/admin/activity"),
  },
  {
    href: "/dashboard/admin/resources",
    label: "Resources",
    icon: "📎",
    match: (p) => p.startsWith("/dashboard/admin/resources"),
  },
  {
    href: "/dashboard/admin/certificates",
    label: "Certificates",
    icon: "🏆",
    match: (p) => p.startsWith("/dashboard/admin/certificates"),
  },
  {
    href: "/dashboard/admin/payments",
    label: "Payments",
    icon: "💰",
    match: (p) => p.startsWith("/dashboard/admin/payments"),
  },
  { href: "/courses", label: "Catalog", icon: "◇" },
];

interface DashboardSidebarProps {
  role: "TEACHER" | "ADMIN" | "STUDENT";
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname();
  const items =
    role === "STUDENT" ? studentNav : role === "ADMIN" ? adminNav : teacherNav;

  return (
    <aside className="w-full shrink-0 lg:w-56">
      <nav className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-2 lg:flex-col lg:overflow-visible">
        {items.map((item) => {
          const active =
            item.match?.(pathname) ??
            (pathname === item.href ||
              (item.href !== "/dashboard/teacher" &&
                item.href !== "/dashboard/student" &&
                item.href !== "/dashboard/admin" &&
                pathname.startsWith(item.href)));

          return (
            <Link key={`${item.href}-${item.label}`} href={item.href}>
              <motion.span
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "gradient-brand text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                whileHover={{ x: active ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span aria-hidden className="text-xs opacity-80">
                  {item.icon}
                </span>
                {item.label}
              </motion.span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
