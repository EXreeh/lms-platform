"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { MessagesHub } from "@/components/institute/messages-hub";

export default function StudentMessagesPage() {
  return (
    <DashboardShell title="Messages" description="Inbox and communication with your teacher and admin." badge="Student Portal">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1">
          <MessagesHub role="STUDENT" />
        </div>
      </div>
    </DashboardShell>
  );
}
