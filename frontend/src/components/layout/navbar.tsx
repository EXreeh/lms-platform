import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

interface NavbarProps {
  userName?: string;
  onLogout?: () => void;
}

export function Navbar({ userName, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo size="md" />

        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main navigation">
          <ThemeToggle />
          {userName ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
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
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Sign in
              </Link>
              <Link href="/register">
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
