"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showLabel = true,
  size = "md",
  className = "",
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const heights = { sm: "h-1", md: "h-2", lg: "h-3" };

  return (
    <div className={className}>
      {(label || showLabel) && (
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
          {label ? <span>{label}</span> : <span />}
          {showLabel && <span className="font-medium text-foreground">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`overflow-hidden rounded-full bg-muted ${heights[size]}`}>
        <motion.div
          className={`${heights[size]} rounded-full gradient-brand`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
