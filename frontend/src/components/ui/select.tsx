import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", id, ...props }, ref) => {
    const selectId = id ?? props.name;

    return (
      <div className="space-y-1.5">
        <label htmlFor={selectId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded-xl border bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-colors focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25 ${error ? "border-red-400" : "border-border"} ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error ? <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p> : null}
      </div>
    );
  },
);

Select.displayName = "Select";
