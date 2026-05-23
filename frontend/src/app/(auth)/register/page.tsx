"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { PageBackground } from "@/components/layout/page-background";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { registerUser } from "@/lib/auth-api";
import { useAuth } from "@/context/auth-context";
import { ApiClientError } from "@/lib/api";
import type { Role } from "@/types/auth";

export default function RegisterPage() {
  const { login } = useAuth();
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
      const response = await registerUser({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password: String(form.get("password")),
        role: String(form.get("role")) as Role,
      });
      login(response.data.user, response.data.token);
    } catch (err) {
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
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageBackground variant="auth">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <AuthFormCard
          title="Join Cognitiax AI"
          subtitle="Create your account as a student or educator"
          footer={
            <>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-green-700 hover:text-green-600 dark:text-gold-400 dark:hover:text-gold-300"
              >
                Sign in
              </Link>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label="Full name"
              name="name"
              required
              minLength={2}
              autoComplete="name"
              error={fieldErrors.name}
              disabled={isLoading}
            />
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
              minLength={8}
              autoComplete="new-password"
              error={fieldErrors.password}
              disabled={isLoading}
            />
            <Select
              label="I am a"
              name="role"
              defaultValue="STUDENT"
              disabled={isLoading}
              options={[
                { value: "STUDENT", label: "Student" },
                { value: "TEACHER", label: "Teacher / Educator" },
              ]}
            />
            {error ? (
              <p
                className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={isLoading}
              isLoading={isLoading}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" label="Creating account" />
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </AuthFormCard>
      </div>
    </PageBackground>
  );
}
