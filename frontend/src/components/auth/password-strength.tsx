"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PASSWORD_RULES, getPasswordStrength } from "@/lib/password-validation";

interface PasswordStrengthProps {
  password: string;
  confirmPassword?: string;
}

export function PasswordStrength({ password, confirmPassword }: PasswordStrengthProps) {
  const strength = getPasswordStrength(password);
  const passwordsMatch =
    confirmPassword === undefined || confirmPassword === "" || password === confirmPassword;

  return (
    <div className="space-y-3" aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">Password strength</span>
        <motion.span
          key={strength.label}
          initial={{ opacity: 0, x: 4 }}
          animate={{ opacity: 1, x: 0 }}
          className={
            strength.valid
              ? "font-semibold text-green-600 dark:text-green-400"
              : "text-muted-foreground"
          }
        >
          {strength.label}
        </motion.span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full rounded-full ${strength.valid ? "gradient-brand" : "bg-gold-500"}`}
          initial={{ width: 0 }}
          animate={{ width: `${strength.score}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <motion.li
              key={rule.id}
              initial={false}
              animate={{ opacity: password ? 1 : 0.6 }}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  passed
                    ? "bg-green-600 text-white dark:bg-green-500"
                    : "border border-border bg-card text-transparent"
                }`}
                aria-hidden
              >
                ✓
              </span>
              <span className={passed ? "text-foreground" : "text-muted-foreground"}>
                {rule.label}
              </span>
            </motion.li>
          );
        })}
      </ul>
      <AnimatePresence>
        {confirmPassword !== undefined && confirmPassword !== "" && !passwordsMatch && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            Passwords do not match
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
