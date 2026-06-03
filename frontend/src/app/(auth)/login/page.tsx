"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { PageBackground } from "@/components/layout/page-background";
import { PageTransition } from "@/components/motion/page-transition";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { loginUser } from "@/lib/auth-api";
import { useAuth } from "@/context/auth-context";
import { ApiClientError } from "@/lib/api";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { brand } from "@/lib/design-tokens";
import { layout } from "@/lib/layout";

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get("redirect"));
  const sessionExpired = searchParams.get("session") === "expired";
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await loginUser({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      await login(response.data.token, redirectTo);
    } catch (err) {
      if (err instanceof Error && err.message.includes("establish session")) {
        setError("Signed in but session could not be loaded. Please try again.");
        return;
      }
      if (err instanceof ApiClientError) {
        setError(err.message);
        if (err.errors) {
          const mapped: Record<string, string> = {};
          for (const [key, messages] of Object.entries(err.errors)) {
            if (messages?.[0]) mapped[key] = messages[0];
          }
          setFieldErrors(mapped);
        }
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageBackground variant="auth">
      <Navbar />
      <div className={`${layout.page} py-12 lg:py-20`}>
        <PageTransition>
        <AuthFormCard
          title="Welcome back"
          subtitle={`Sign in to your ${brand.name} dashboard`}
          footer={
            <>
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-green-700 hover:text-green-600 dark:text-gold-400 dark:hover:text-gold-300"
              >
                Create account
              </Link>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {sessionExpired ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                Your session expired or is no longer valid. Please sign in again.
              </p>
            ) : null}
            <Input
              label="Email"
              name="email"
              type="email"
              required
              autoComplete="email"
              error={fieldErrors.email}
              disabled={isLoading}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              error={fieldErrors.password}
              disabled={isLoading}
            />
            <div className="-mt-2 flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-green-700 hover:underline dark:text-gold-400"
              >
                Forgot password?
              </Link>
            </div>
            {error ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
                role="alert"
              >
                {error}
              </motion.p>
            ) : null}
            <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" label="Signing in" />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </AuthFormCard>
        </PageTransition>
      </div>
    </PageBackground>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
