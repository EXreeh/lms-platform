"use client";

import { motion } from "framer-motion";

export function DemoBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm text-foreground"
      role="status"
    >
      <strong className="text-gold-700 dark:text-gold-400">Demo preview</strong> — showing sample
      data. Run{" "}
      <code className="rounded bg-card px-1.5 py-0.5 text-xs">npm run db:seed</code> for live
      courses, or create your own.
    </motion.div>
  );
}
