"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { LiveClassDetailPanel } from "@/components/live-classes/live-class-detail-panel";
import { Spinner } from "@/components/ui/spinner";
import { fetchStudentLiveClass } from "@/lib/live-classes-api";
import type { LiveClass } from "@/types/institute";
import { formatApiError } from "@/lib/format-api-error";
import { useToast } from "@/context/toast-context";

export default function StudentLiveClassDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { error: toastError } = useToast();
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchStudentLiveClass(id)
      .then((res) => setLiveClass(res.data))
      .catch((err) => toastError(formatApiError(err, "Failed to load")))
      .finally(() => setLoading(false));
  }, [id, toastError]);

  return (
    <DashboardShell title="Live class" description="Your batch session." badge="Student">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1">
          <Link href="/dashboard/student/live-classes" className="text-sm text-primary hover:underline">
            ← Back
          </Link>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner label="Loading" /></div>
          ) : liveClass ? (
            <div className="mt-4">
              <LiveClassDetailPanel
                liveClass={liveClass}
                role="STUDENT"
                batches={[]}
                onUpdated={setLiveClass}
              />
            </div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
