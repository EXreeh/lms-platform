"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { joinLiveClass } from "@/lib/live-classes-api";
import { formatApiError } from "@/lib/format-api-error";
import type { LiveClass } from "@/types/institute";

interface JoinLiveClassButtonProps {
  liveClass: Pick<LiveClass, "id" | "status" | "canJoin" | "joinUrl" | "meetingUrl">;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function JoinLiveClassButton({
  liveClass,
  label = "Join Live Class",
  size = "sm",
}: JoinLiveClassButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (liveClass.status === "CANCELLED") {
    return <span className="text-xs font-medium text-red-600">Cancelled</span>;
  }

  if (liveClass.status === "COMPLETED") {
    return <span className="text-xs font-medium text-muted-foreground">Completed</span>;
  }

  const disabled = !liveClass.canJoin && !liveClass.joinUrl && !liveClass.meetingUrl;

  async function handleJoin() {
    setLoading(true);
    setError(null);
    try {
      const res = await joinLiveClass(liveClass.id);
      const url = res.data.joinUrl || res.data.meetingUrl;
      if (!url) {
        setError("No meeting link available");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(formatApiError(err, "Unable to join live class"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        size={size}
        variant="gold"
        disabled={disabled || loading}
        onClick={() => void handleJoin()}
      >
        {loading ? "Opening..." : label}
      </Button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
