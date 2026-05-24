"use client";

import { useEffect, useState } from "react";
import { checkEmailAvailability } from "@/lib/auth-api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailCheckStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function useDebouncedEmailCheck(email: string, delayMs = 500) {
  const [status, setStatus] = useState<EmailCheckStatus>("idle");

  useEffect(() => {
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setStatus("idle");
      return;
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");

    const timer = setTimeout(async () => {
      try {
        const res = await checkEmailAvailability(trimmed);
        setStatus(res.data.available ? "available" : "taken");
      } catch {
        setStatus("idle");
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [email, delayMs]);

  return status;
}
