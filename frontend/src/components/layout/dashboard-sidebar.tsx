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
  {
    href: "/dashboard/teacher/quizzes",
    label: "Quizzes",
    icon: "?",
    match: (p) => p.startsWith("/dashboard/teacher/quizzes"),
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
];

const adminNav: NavItem[] = [
  {
    href: "/dashboard/admin",
    label: "Overview",
    icon: "◈",
    match: (p) => p === "/dashboard/admin",
  },
  { href: "/courses", label: "Catalog", icon: "◎" },
  {
    href: "/dashboard/teacher/quizzes",
    label: "Quizzes",
    icon: "?",
    match: (p) => p.startsWith("/dashboard/teacher/quizzes"),
  },
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
