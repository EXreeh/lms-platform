"use client";

import { motion, AnimatePresence } from "framer-motion";

type Status = "idle" | "checking" | "available" | "taken" | "invalid";

interface EmailAvailabilityProps {
  status: Status;
}

const messages: Record<Exclude<Status, "idle" | "checking">, { text: string; className: string }> =
  {
    available: {
      text: "Email available",
      className: "text-green-600 dark:text-green-400",
    },
    taken: {
      text: "Email already registered",
      className: "text-red-600 dark:text-red-400",
    },
    invalid: {
      text: "Enter a valid email address",
      className: "text-amber-600 dark:text-amber-400",
    },
  };

export function EmailAvailability({ status }: EmailAvailabilityProps) {
  if (status === "idle" || status === "checking") {
    return status === "checking" ? (
      <p className="text-xs text-muted-foreground">Checking availability…</p>
    ) : null;
  }

  const msg = messages[status];

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={status}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`text-xs font-medium ${msg.className}`}
        role="status"
      >
        {msg.text}
      </motion.p>
    </AnimatePresence>
  );
}
