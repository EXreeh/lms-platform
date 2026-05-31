"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { PageBackground } from "@/components/layout/page-background";
import { PageTransition } from "@/components/motion/page-transition";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PasswordStrength } from "@/components/auth/password-strength";
import { EmailAvailability } from "@/components/auth/email-availability";
import { OtpModal } from "@/components/auth/otp-modal";
import { useDebouncedEmailCheck } from "@/hooks/use-debounced-email-check";
import {
  requestRegistrationOtp,
  resendRegistrationOtp,
  verifyRegistrationOtp,
} from "@/lib/auth-api";
import { useAuth } from "@/context/auth-context";
import { ApiClientError } from "@/lib/api";
import { getPasswordStrength } from "@/lib/password-validation";

export default function RegisterPage() {
  const { login } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);

  const emailStatus = useDebouncedEmailCheck(email);
  const passwordStrength = getPasswordStrength(password);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (emailStatus === "taken") {
      setError("This email is already registered.");
      return;
    }
    if (emailStatus === "invalid") {
      setError("Please enter a valid email address.");
      return;
    }
    if (!passwordStrength.valid) {
      setError("Please meet all password requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await requestRegistrationOtp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
      });
      setOtpOpen(true);
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
        setError("Could not start registration. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(otp: string) {
    const response = await verifyRegistrationOtp(email.trim().toLowerCase(), otp);
    setOtpOpen(false);
    login(response.data.user, response.data.token);
  }

  async function handleResendOtp() {
    await resendRegistrationOtp(email.trim().toLowerCase());
  }

  return (
    <PageBackground variant="auth">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <PageTransition>
          <AuthFormCard
            title="Join CognitiaX AI"
            subtitle="Student registration — verify your email to activate your account"
            footer={
              <>
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-green-700 hover:text-green-600 dark:text-gold-400"
                >
                  Sign in
                </Link>
              </>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="First name"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                  error={fieldErrors.firstName}
                  disabled={isLoading}
                />
                <Input
                  label="Last name"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                  error={fieldErrors.lastName}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  error={fieldErrors.email}
                  disabled={isLoading}
                />
                <div className="mt-1.5">
                  <EmailAvailability status={emailStatus} />
                </div>
              </div>

              <Input
                label="Password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                error={fieldErrors.password}
                disabled={isLoading}
              />

              <PasswordStrength password={password} confirmPassword={confirmPassword} />

              <Input
                label="Confirm password"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                error={fieldErrors.confirmPassword}
                disabled={isLoading}
              />

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

              <Button
                type="submit"
                variant="gold"
                className="w-full"
                disabled={
                  isLoading ||
                  emailStatus === "taken" ||
                  emailStatus === "invalid" ||
                  !passwordStrength.valid ||
                  password !== confirmPassword
                }
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" label="Sending code" />
                    Sending verification code…
                  </span>
                ) : (
                  "Continue — verify email"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Teacher accounts are created by administrators only.
              </p>
            </form>
          </AuthFormCard>
        </PageTransition>
      </div>

      <OtpModal
        open={otpOpen}
        email={email}
        title="Verify your email"
        subtitle="Enter the 6-digit code we sent to"
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onClose={() => setOtpOpen(false)}
      />
    </PageBackground>
  );
}
