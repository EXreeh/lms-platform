"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { fetchUnreadCount } from "@/lib/messages-api";

export function useUnreadMessages() {
  const { user, isAuthenticated, isLoggingOut, isLoading } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || isLoggingOut || isLoading || !user?.id) {
      setCount(0);
      return;
    }
    void (async () => {
      try {
        const res = await fetchUnreadCount();
        setCount(res.data.count);
      } catch {
        setCount(0);
      }
    })();
  }, [user?.id, isAuthenticated, isLoggingOut, isLoading]);

  return count;
}

export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
