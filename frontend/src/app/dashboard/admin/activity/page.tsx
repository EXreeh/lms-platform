"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchAdminActivity } from "@/lib/admin-api";
import type { ActivityItem, Pagination } from "@/types/admin";
import { ApiClientError } from "@/lib/api";
import { useToast } from "@/context/toast-context";

const ACTIVITY_TYPES = [
  { value: "", label: "All activity" },
  { value: "LOGIN", label: "Logins" },
  { value: "COURSE_CREATED", label: "Course creation" },
  { value: "COURSE_PUBLISHED", label: "Publishing" },
  { value: "COURSE_ARCHIVED", label: "Archiving" },
  { value: "ENROLLMENT", label: "Enrollments" },
  { value: "QUIZ_ATTEMPT", label: "Quiz attempts" },
  { value: "USER_ROLE_CHANGED", label: "Role changes" },
  { value: "USER_SUSPENDED", label: "Suspensions" },
  { value: "USER_CREATED", label: "New accounts" },
];

export default function AdminActivityPage() {
  const { error: toastError } = useToast();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [typeFilter, setTypeFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadActivity = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminActivity({
        page: pagination.page,
        limit: pagination.limit,
        type: typeFilter || undefined,
      });
      setActivities(res.data.activities);
      setPagination(res.data.pagination);
    } catch (err) {
      toastError(err instanceof ApiClientError ? err.message : "Failed to load activity");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, typeFilter, toastError]);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  return (
    <DashboardShell
      title="Platform Activity"
      description="Live feed of logins, enrollments, course events, and quiz attempts."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              label="Filter"
              value={typeFilter}
              options={ACTIVITY_TYPES}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            />
            <Button variant="secondary" size="sm" onClick={() => void loadActivity()}>
              Refresh
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" label="Loading activity feed" />
              </div>
            ) : (
              <ActivityFeed
                items={activities.map((a) => ({
                  id: a.id,
                  message: a.message,
                  timestamp: a.timestamp,
                  type: a.type,
                }))}
                emptyMessage="No activity recorded yet"
              />
            )}

            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardShell>
  );
}
