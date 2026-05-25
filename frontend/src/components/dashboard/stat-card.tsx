"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: string;
  accent?: "gold" | "green" | "default";
}

const accents = {
  gold: "from-gold-500/20 to-gold-600/5 border-gold-500/20",
  green: "from-green-600/15 to-green-700/5 border-green-600/20",
  default: "from-muted/80 to-card border-border",
};

export function StatCard({ label, value, subtext, icon, accent = "default" }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-2xl border bg-gradient-to-br p-5 ${accents[accent]}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon ? (
          <span className="text-lg opacity-60" aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-serif text-3xl font-bold text-foreground">{value}</p>
      {subtext ? <p className="mt-1 text-xs text-muted-foreground">{subtext}</p> : null}
    </motion.div>
  );
}
