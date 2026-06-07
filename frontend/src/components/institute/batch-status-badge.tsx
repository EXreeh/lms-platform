import type { BatchStatus } from "@/types/institute";

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  const styles =
    status === "ACTIVE"
      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
      : status === "COMPLETED"
        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
        : status === "DELETED"
          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
          : "bg-muted text-muted-foreground";
  const label =
    status === "ACTIVE"
      ? "Active"
      : status === "COMPLETED"
        ? "Completed"
        : status === "DELETED"
          ? "Deleted"
          : "Cancelled";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {label}
    </span>
  );
}
