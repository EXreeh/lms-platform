"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchAdminResources,
  removeAdminResource,
  restoreAdminResource,
} from "@/lib/admin-api";
import { RESOURCE_TYPE_ICONS, RESOURCE_TYPE_LABELS } from "@/types/resource";
import { formatApiError } from "@/lib/format-api-error";
import type { Resource } from "@/types/resource";
import { useToast } from "@/context/toast-context";

export default function AdminResourcesPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminResources();
      setResources(res.data?.resources ?? []);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load resources"));
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRemove(resource: Resource) {
    if (!confirm(`Remove "${resource.title}"?`)) return;
    try {
      const res = await removeAdminResource(resource.id);
      toastSuccess(res.message);
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Remove failed"));
    }
  }

  async function handleRestore(resource: Resource) {
    try {
      const res = await restoreAdminResource(resource.id);
      toastSuccess(res.message);
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Restore failed"));
    }
  }

  const pending = resources.filter((r) => r.deleteStatus === "PENDING_DELETE");
  const active = resources.filter((r) => r.deleteStatus !== "PENDING_DELETE");

  function ResourceRow({
    resource,
    pendingDelete,
  }: {
    resource: Resource;
    pendingDelete?: boolean;
  }) {
    return (
      <motion.li
        layout
        className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4 ${
          pendingDelete
            ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
            : "border-border bg-card"
        }`}
      >
        <div className="flex min-w-0 gap-3">
          <span className="text-2xl" aria-hidden>
            {RESOURCE_TYPE_ICONS[resource.type]}
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{resource.title}</p>
            <p className="text-xs text-muted-foreground">
              {RESOURCE_TYPE_LABELS[resource.type]}
              {resource.course?.title ? ` · ${resource.course.title}` : ""}
              {resource.uploadedBy ? ` · ${resource.uploadedBy.name}` : ""}
            </p>
            {resource.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{resource.description}</p>
            )}
            {pendingDelete && (
              <span className="mt-1 inline-block text-xs font-medium text-amber-700 dark:text-amber-400">
                Teacher requested deletion
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <a href={resource.url} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="secondary" size="sm">
              Open
            </Button>
          </a>
          {resource.course?.slug && (
            <Link href={`/courses/${resource.course.slug}`}>
              <Button type="button" variant="ghost" size="sm">
                Course
              </Button>
            </Link>
          )}
          {pendingDelete ? (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleRestore(resource)}>
                Keep
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => handleRemove(resource)}
              >
                Remove
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={() => handleRemove(resource)}
            >
              Remove
            </Button>
          )}
        </div>
      </motion.li>
    );
  }

  return (
    <DashboardShell
      title="Resource Moderation"
      description="Review and moderate course resources uploaded by teachers."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-8">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : resources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-4xl">📎</p>
              <h2 className="mt-4 font-serif text-xl font-bold">No resources on platform</h2>
              <p className="mt-2 text-muted-foreground">Teachers haven&apos;t uploaded any resources yet.</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {pending.length > 0 && (
                <section>
                  <h2 className="font-serif text-lg font-bold text-amber-700 dark:text-amber-400">
                    Pending deletion ({pending.length})
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {pending.map((resource) => (
                      <ResourceRow key={resource.id} resource={resource} pendingDelete />
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h2 className="font-serif text-lg font-bold">Active resources ({active.length})</h2>
                {active.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No active resources.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {active.map((resource) => (
                      <ResourceRow key={resource.id} resource={resource} />
                    ))}
                  </ul>
                )}
              </section>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
