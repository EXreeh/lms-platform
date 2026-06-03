"use client";

import { Navbar } from "@/components/layout/navbar";
import { PageBackground } from "@/components/layout/page-background";
import { AuthLoading } from "@/components/auth/auth-loading";
import { SiteFooter } from "@/components/layout/site-footer";
import { layout } from "@/lib/layout";
import { useAuth } from "@/context/auth-context";

interface DashboardShellProps {
  title: string;
  description: string;
  badge?: string;
  children?: React.ReactNode;
}

const roleBadgeColors: Record<string, string> = {
  STUDENT: "bg-green-700/10 text-green-700 dark:bg-green-400/10 dark:text-green-400",
  TEACHER: "bg-gold-500/15 text-gold-700 dark:text-gold-400",
  ADMIN: "gradient-brand text-white",
};

export function DashboardShell({ title, description, badge, children }: DashboardShellProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const role = user?.role;

  if (isLoading || !isAuthenticated || !role) {
    return (
      <PageBackground variant="dashboard">
        <Navbar />
        <AuthLoading />
      </PageBackground>
    );
  }

  return (
    <PageBackground variant="dashboard">
      <Navbar />
      <main className={`${layout.dashboard} py-10`}>
        <div className="mb-10">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${roleBadgeColors[role]}`}
          >
            {badge ?? `${role} Portal`}
          </span>
          <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        {children}
      </main>
      <SiteFooter />
    </PageBackground>
  );
}
