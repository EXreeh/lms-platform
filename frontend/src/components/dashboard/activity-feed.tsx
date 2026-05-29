"use client";

import { motion } from "framer-motion";

interface ActivityItem {
  id: string;
  message: string;
  timestamp: string;
  type?: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  emptyMessage?: string;
}

function activityDot(type?: string): string {
  switch (type) {
    case "LOGIN":
      return "bg-blue-500";
    case "COURSE_CREATED":
    case "COURSE_PUBLISHED":
      return "bg-green-500";
    case "COURSE_ARCHIVED":
    case "USER_SUSPENDED":
      return "bg-red-500";
    case "ENROLLMENT":
    case "QUIZ_ATTEMPT":
      return "bg-gold-500";
    default:
      return "bg-muted-foreground";
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ActivityFeed({ items, emptyMessage = "No recent activity" }: ActivityFeedProps) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <motion.li
          key={item.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex gap-3 rounded-lg bg-muted/40 px-4 py-3"
        >
          <span
            className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${activityDot(item.type)}`}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">{item.message}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(item.timestamp)}</p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
