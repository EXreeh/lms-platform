interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "dashed" | "gradient";
}

export function Card({
  title,
  description,
  children,
  className = "",
  variant = "default",
}: CardProps) {
  const variants = {
    default: "border border-border bg-card shadow-sm",
    dashed: "border border-dashed border-green-700/30 bg-muted/50 dark:border-green-600/30",
    gradient: "gradient-border bg-card",
  };

  return (
    <section className={`rounded-2xl p-6 ${variants[variant]} ${className}`}>
      {title ? (
        <header className="mb-4">
          <h2 className="font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
