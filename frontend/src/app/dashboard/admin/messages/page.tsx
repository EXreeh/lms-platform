"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { MessagesHub } from "@/components/institute/messages-hub";

export default function AdminMessagesPage() {
  return (
    <DashboardShell
      title="Messages"
      description="Send announcements, fee reminders, and updates to students and teachers."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1">
          <MessagesHub role="ADMIN" />
        </div>
      </div>
    </DashboardShell>
  );
}
