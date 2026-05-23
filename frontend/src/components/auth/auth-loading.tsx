import { Spinner } from "@/components/ui/spinner";

export function AuthLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Spinner size="lg" label="Loading session" />
      <p className="text-sm text-muted-foreground">Loading your session…</p>
    </div>
  );
}
