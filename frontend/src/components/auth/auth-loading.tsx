import { Spinner } from "@/components/ui/spinner";

interface AuthLoadingProps {
  slowMessage?: string;
}

export function AuthLoading({ slowMessage }: AuthLoadingProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <Spinner size="lg" label="Loading session" />
      <p className="text-sm text-muted-foreground">
        {slowMessage ?? "Loading your session…"}
      </p>
    </div>
  );
}
