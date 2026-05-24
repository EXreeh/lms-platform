"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiClientError } from "@/lib/api";

interface OtpModalProps {
  open: boolean;
  email: string;
  title: string;
  subtitle: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onClose: () => void;
  resendCooldownSeconds?: number;
}

export function OtpModal({
  open,
  email,
  title,
  subtitle,
  onVerify,
  onResend,
  onClose,
  resendCooldownSeconds = 60,
}: OtpModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!open) {
      setDigits(Array(6).fill(""));
      setError(null);
      setCooldown(0);
    }
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("");
    pasted.split("").forEach((d, i) => {
      next[i] = d;
    });
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleVerify() {
    const otp = digits.join("");
    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      await onVerify(otp);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Verification failed",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    setError(null);
    try {
      await onResend();
      setCooldown(resendCooldownSeconds);
      setDigits(Array(6).fill(""));
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="otp-title"
              className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="otp-title" className="font-serif text-xl font-bold text-foreground">
                {title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{email}</p>

              <div className="mt-8 flex justify-center gap-2" onPaste={handlePaste}>
                {digits.map((digit, i) => (
                  <motion.input
                    key={i}
                    ref={(el) => {
                      inputsRef.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e.key)}
                    className="h-12 w-10 rounded-xl border border-border bg-background text-center text-lg font-semibold text-foreground shadow-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25 sm:h-14 sm:w-12"
                    aria-label={`Digit ${i + 1}`}
                    whileFocus={{ scale: 1.05 }}
                    transition={{ duration: 0.15 }}
                  />
                ))}
              </div>

              {error ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-center text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {error}
                </motion.p>
              ) : null}

              <Button
                type="button"
                className="mt-6 w-full"
                onClick={handleVerify}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" label="Verifying" />
                    Verifying…
                  </span>
                ) : (
                  "Verify code"
                )}
              </Button>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Didn&apos;t receive it?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || cooldown > 0}
                  className="font-semibold text-green-700 hover:underline disabled:opacity-50 dark:text-gold-400"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : isResending ? "Sending…" : "Resend code"}
                </button>
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
