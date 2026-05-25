"use client";

import { motion } from "framer-motion";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: string;
}

export function EmptyState({ title, description, action, icon = "📚" }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-8 py-16 text-center"
    >
      <span className="mb-4 text-4xl" aria-hidden>
        {icon}
      </span>
      <h3 className="font-serif text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </motion.div>
  );
}
