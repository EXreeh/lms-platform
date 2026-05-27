import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

interface NavbarProps {
  userName?: string;
  onLogout?: () => void;
  dashboardHref?: string;
}

export function Navbar({ userName, onLogout, dashboardHref }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo size="md" />

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
          <Link
            href="/courses"
            className="rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3"
          >
            Courses
          </Link>
          {dashboardHref && (
            <Link
              href={dashboardHref}
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xs:inline sm:inline"
            >
              Dashboard
            </Link>
          )}
          <ThemeToggle />
          {userName ? (
            <>
              <span className="hidden max-w-[8rem] truncate text-sm text-muted-foreground md:inline">
                Hi, <span className="font-medium text-foreground">{userName}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3"
              >
                Sign in
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button size="sm" variant="gold">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
