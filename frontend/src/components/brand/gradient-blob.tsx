interface GradientBlobProps {
  className?: string;
  variant?: "gold" | "green" | "mixed";
}

export function GradientBlob({ className = "", variant = "mixed" }: GradientBlobProps) {
  const colors = {
    gold: "from-gold-500/20 via-gold-400/10 to-transparent",
    green: "from-green-600/20 via-green-700/10 to-transparent",
    mixed: "from-gold-500/15 via-green-600/10 to-transparent",
  };

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-3xl ${colors[variant]} ${className}`}
    />
  );
}
