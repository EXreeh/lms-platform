import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl">🔒</p>
      <h1 className="mt-4 font-serif text-2xl font-bold">Access denied</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        You do not have permission to view this resource. If you believe this is an error, contact your
        institute administrator.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard/profile">
          <Button variant="secondary">My profile</Button>
        </Link>
        <Link href="/login">
          <Button variant="gold">Sign in</Button>
        </Link>
      </div>
    </div>
  );
}
