import type { SalaryStatus } from "@/types/institute";

export function SalaryStatusBadge({ status }: { status: SalaryStatus }) {
  const styles =
    status === "PAID"
      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
      : status === "HOLD"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        : "bg-muted text-muted-foreground";
  const label = status === "PAID" ? "Paid" : status === "HOLD" ? "On hold" : "Pending";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {label}
    </span>
  );
}
