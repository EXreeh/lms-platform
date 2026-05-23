import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25 ${error ? "border-red-400 focus:border-red-400 focus:ring-red-400/25" : "border-border"} ${className}`}
          {...props}
        />
        {error ? <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p> : null}
      </div>
    );
  },
);

Input.displayName = "Input";
