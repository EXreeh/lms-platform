"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const teacherNav: NavItem[] = [
  { href: "/dashboard/teacher", label: "Overview", icon: "◈" },
  { href: "/dashboard/teacher/courses/new", label: "Create course", icon: "＋" },
  { href: "/courses", label: "Browse catalog", icon: "◎" },
];

const studentNav: NavItem[] = [
  { href: "/dashboard/student", label: "Dashboard", icon: "◈" },
  { href: "/courses", label: "Browse courses", icon: "◎" },
];

const adminNav: NavItem[] = [
  { href: "/dashboard/admin", label: "Overview", icon: "◈" },
  { href: "/courses", label: "Catalog", icon: "◎" },
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
            pathname === item.href ||
            (item.href !== "/dashboard/teacher" &&
              item.href !== "/dashboard/student" &&
              pathname.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
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
