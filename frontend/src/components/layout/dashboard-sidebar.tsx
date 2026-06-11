"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { displayRole, type AppRole, type Role } from "@/types/auth";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  match?: (pathname: string) => boolean;
}

const teacherNav: NavItem[] = [
  {
    href: "/dashboard/teacher",
    label: "Dashboard",
    icon: "◈",
    match: (p) => p === "/dashboard/teacher",
  },
  {
    href: "/dashboard/teacher/batches",
    label: "My Batches",
    icon: "👥",
    match: (p) => p.startsWith("/dashboard/teacher/batches"),
  },
  {
    href: "/dashboard/teacher/courses",
    label: "My Courses",
    icon: "📚",
    match: (p) => p.startsWith("/dashboard/teacher/courses"),
  },
  {
    href: "/dashboard/teacher/messages",
    label: "Messages",
    icon: "✉",
    match: (p) => p.startsWith("/dashboard/teacher/messages"),
  },
  {
    href: "/dashboard/teacher/salary",
    label: "My Salary",
    icon: "💰",
    match: (p) => p.startsWith("/dashboard/teacher/salary"),
  },
  {
    href: "/dashboard/teacher/attendance",
    label: "Attendance",
    icon: "📋",
    match: (p) => p.startsWith("/dashboard/teacher/attendance"),
  },
  {
    href: "/dashboard/teacher/live-classes",
    label: "My Live Classes",
    icon: "▶",
    match: (p) => p.startsWith("/dashboard/teacher/live-classes"),
  },
  {
    href: "/dashboard/teacher/recordings",
    label: "Batch Recordings",
    icon: "🎬",
    match: (p) => p.startsWith("/dashboard/teacher/recordings"),
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: "👤",
    match: (p) => p.startsWith("/dashboard/profile"),
  },
];

const studentNav: NavItem[] = [
  {
    href: "/dashboard/student",
    label: "Dashboard",
    icon: "◈",
    match: (p) => p === "/dashboard/student",
  },
  {
    href: "/dashboard/student/courses",
    label: "My Courses",
    icon: "📚",
    match: (p) => p.startsWith("/dashboard/student/courses"),
  },
  {
    href: "/dashboard/student/batch",
    label: "My Batch",
    icon: "👥",
    match: (p) => p.startsWith("/dashboard/student/batch"),
  },
  {
    href: "/dashboard/student/fees",
    label: "My Fees",
    icon: "₹",
    match: (p) => p.startsWith("/dashboard/student/fees"),
  },
  {
    href: "/dashboard/student/messages",
    label: "Messages",
    icon: "✉",
    match: (p) => p.startsWith("/dashboard/student/messages"),
  },
  {
    href: "/dashboard/student/live-classes",
    label: "Live Classes",
    icon: "▶",
    match: (p) => p.startsWith("/dashboard/student/live-classes"),
  },
  {
    href: "/dashboard/student/recordings",
    label: "Recordings",
    icon: "🎬",
    match: (p) => p.startsWith("/dashboard/student/recordings"),
  },
  {
    href: "/dashboard/student/resources",
    label: "Resources",
    icon: "📎",
    match: (p) => p.startsWith("/dashboard/student/resources"),
  },
  {
    href: "/dashboard/student/certificates",
    label: "Certificates",
    icon: "🏆",
    match: (p) => p.startsWith("/dashboard/student/certificates") || p.includes("/certificate"),
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: "👤",
    match: (p) => p.startsWith("/dashboard/profile"),
  },
];

const adminNav: NavItem[] = [
  {
    href: "/dashboard/admin",
    label: "Dashboard",
    icon: "◈",
    match: (p) => p === "/dashboard/admin",
  },
  {
    href: "/dashboard/admin/users",
    label: "Students",
    icon: "🎓",
    match: (p) => p.startsWith("/dashboard/admin/users"),
  },
  {
    href: "/dashboard/admin/users?role=TEACHER",
    label: "Teachers",
    icon: "👨‍🏫",
    match: (p) => p.startsWith("/dashboard/admin/users"),
  },
  {
    href: "/dashboard/admin/courses",
    label: "Courses",
    icon: "📚",
    match: (p) => p.startsWith("/dashboard/admin/courses"),
  },
  {
    href: "/dashboard/admin/batches",
    label: "Batches",
    icon: "📅",
    match: (p) => p.startsWith("/dashboard/admin/batches"),
  },
  {
    href: "/dashboard/admin/fees",
    label: "Fees",
    icon: "₹",
    match: (p) => p.startsWith("/dashboard/admin/fees"),
  },
  {
    href: "/dashboard/admin/course-access",
    label: "Course Access",
    icon: "🔐",
    match: (p) => p.startsWith("/dashboard/admin/course-access"),
  },
  {
    href: "/dashboard/admin/messages",
    label: "Messages",
    icon: "✉",
    match: (p) => p.startsWith("/dashboard/admin/messages"),
  },
  {
    href: "/dashboard/admin/teacher-salaries",
    label: "Teacher Salaries",
    icon: "💰",
    match: (p) => p.startsWith("/dashboard/admin/teacher-salaries"),
  },
  {
    href: "/dashboard/admin/teacher-attendance",
    label: "Teacher Attendance",
    icon: "📋",
    match: (p) => p.startsWith("/dashboard/admin/teacher-attendance"),
  },
  {
    href: "/dashboard/admin/live-classes",
    label: "Live Classes",
    icon: "▶",
    match: (p) => p.startsWith("/dashboard/admin/live-classes"),
  },
  {
    href: "/dashboard/admin/recordings",
    label: "Recordings",
    icon: "🎬",
    match: (p) => p.startsWith("/dashboard/admin/recordings"),
  },
  {
    href: "/dashboard/admin/activity",
    label: "Reports",
    icon: "◎",
    match: (p) =>
      p.startsWith("/dashboard/admin/activity") ||
      p.startsWith("/dashboard/admin/payments") ||
      p.startsWith("/dashboard/admin/certificates"),
  },
  {
    href: "/dashboard/admin/audit-logs",
    label: "Audit Logs",
    icon: "📜",
    match: (p) => p.startsWith("/dashboard/admin/audit-logs"),
  },
  {
    href: "/dashboard/admin/security",
    label: "Security",
    icon: "🔒",
    match: (p) => p.startsWith("/dashboard/admin/security"),
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: "👤",
    match: (p) => p.startsWith("/dashboard/profile"),
  },
];

interface DashboardSidebarProps {
  role: AppRole;
}

function sidebarRole(role: Role | AppRole): AppRole {
  return displayRole(role as Role);
}

export function DashboardSidebar({ role: fallbackRole }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const rawRole: Role | AppRole = isAuthenticated && user ? user.role : fallbackRole;
  const role = sidebarRole(rawRole);
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
