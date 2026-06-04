"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { MessagesHub } from "@/components/institute/messages-hub";

export default function TeacherMessagesPage() {
  return (
    <DashboardShell title="Messages" description="Communicate with your batch students." badge="Teacher Portal">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1">
          <MessagesHub role="TEACHER" />
        </div>
      </div>
    </DashboardShell>
  );
}
