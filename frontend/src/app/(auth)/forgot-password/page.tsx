"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { PageBackground } from "@/components/layout/page-background";
import { PageTransition } from "@/components/motion/page-transition";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PasswordStrength } from "@/components/auth/password-strength";
import { OtpModal } from "@/components/auth/otp-modal";
import {
  requestPasswordResetOtp,
  resendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
} from "@/lib/auth-api";
import { ApiClientError } from "@/lib/api";
import { getEmailErrorMessage } from "@/lib/email-error-messages";
import { getPasswordStrength } from "@/lib/password-validation";

type Step = "email" | "reset" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  async function handleRequestOtp(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await requestPasswordResetOtp(email.trim().toLowerCase());
      setOtpOpen(true);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? getEmailErrorMessage(err.code, err.message)
          : "Something went wrong.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(otp: string) {
    const res = await verifyPasswordResetOtp(email.trim().toLowerCase(), otp);
    setResetToken(res.data.resetToken);
    setOtpOpen(false);
    setStep("reset");
  }

  async function handleResendOtp() {
    await resendPasswordResetOtp(email.trim().toLowerCase());
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!passwordStrength.valid || password !== confirmPassword) {
      setError("Please meet all password requirements and confirm your password.");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({
        resetToken,
        password,
        confirmPassword,
      });
      setStep("success");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not reset password.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageBackground variant="auth">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-20">
        <PageTransition>
          <AnimatePresence mode="wait">
            {step === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto max-w-md text-center"
              >
                <div className="gradient-border rounded-2xl bg-card p-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full gradient-brand text-2xl text-white"
                  >
                    ✓
                  </motion.div>
                  <h1 className="font-serif text-2xl font-bold text-foreground">
                    Password updated
                  </h1>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Your password has been reset successfully. You can now sign in with your new
                    credentials.
                  </p>
                  <Link href="/login" className="mt-8 inline-block">
                    <Button variant="gold" size="lg">
                      Back to sign in
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <AuthFormCard
                  title={step === "email" ? "Reset your password" : "Create new password"}
                  subtitle={
                    step === "email"
                      ? "We'll send a verification code to your email"
                      : "Choose a strong new password for your account"
                  }
                  footer={
                    <Link
                      href="/login"
                      className="font-semibold text-green-700 hover:text-green-600 dark:text-gold-400"
                    >
                      Back to sign in
                    </Link>
                  }
                >
                  {step === "email" ? (
                    <form onSubmit={handleRequestOtp} className="space-y-5">
                      <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        disabled={isLoading}
                      />
                      {error ? (
                        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                          {error}
                        </p>
                      ) : null}
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <span className="inline-flex items-center gap-2">
                            <Spinner size="sm" label="Sending" />
                            Sending code…
                          </span>
                        ) : (
                          "Send verification code"
                        )}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                      <Input
                        label="New password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        disabled={isLoading}
                      />
                      <PasswordStrength password={password} confirmPassword={confirmPassword} />
                      <Input
                        label="Confirm new password"
                        name="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        disabled={isLoading}
                      />
                      {error ? (
                        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                          {error}
                        </p>
                      ) : null}
                      <Button
                        type="submit"
                        variant="gold"
                        className="w-full"
                        disabled={
                          isLoading || !passwordStrength.valid || password !== confirmPassword
                        }
                      >
                        {isLoading ? (
                          <span className="inline-flex items-center gap-2">
                            <Spinner size="sm" label="Resetting" />
                            Updating password…
                          </span>
                        ) : (
                          "Update password"
                        )}
                      </Button>
                    </form>
                  )}
                </AuthFormCard>
              </motion.div>
            )}
          </AnimatePresence>
        </PageTransition>
      </div>

      <OtpModal
        open={otpOpen}
        email={email}
        title="Verify your identity"
        subtitle="Enter the code sent to"
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onClose={() => setOtpOpen(false)}
      />
    </PageBackground>
  );
}
