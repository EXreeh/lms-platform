"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ResourceList } from "@/components/resources/resource-list";
import { ResourceForm } from "@/components/resources/resource-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchTeacherResources,
  createResource,
  updateResource,
  deleteResource,
} from "@/lib/resources-api";
import { fetchCourses } from "@/lib/courses-api";
import { formatApiError } from "@/lib/format-api-error";
import type { ResourceFormPayload } from "@/components/resources/resource-form";
import type { Resource } from "@/types/resource";
import { useToast } from "@/context/toast-context";

export default function TeacherResourcesPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [courses, setCourses] = useState<{ id: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchTeacherResources();
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

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchCourses({ mine: true }, true);
        setCourses((res.data?.courses ?? []).map((c) => ({ id: c.id, label: c.title })));
      } catch {
        setCourses([]);
      }
    })();
  }, []);

  async function handleCreate(data: ResourceFormPayload) {
    try {
      if (editing) {
        await updateResource(editing.id, {
          title: data.title,
          description: data.description,
          type: data.type,
          url: data.url,
          fileName: data.fileName,
        });
        toastSuccess("Resource updated");
      } else {
        if (!data.courseId) {
          toastError("Please select a course before adding a resource.");
          return;
        }
        await createResource(data);
        toastSuccess("Resource added");
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Save failed"));
    }
  }

  async function handleDelete(resource: Resource) {
    if (!confirm("Remove this resource? Admin approval may be required.")) return;
    try {
      const res = await deleteResource(resource.id);
      toastSuccess(res.message);
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Delete failed"));
    }
  }

  const courseResources = resources.filter((r) => !r.lessonId);
  const lessonResources = resources.filter((r) => r.lessonId);

  return (
    <DashboardShell
      title="Course Resources"
      description="Manage PDFs, links, notes, and assignments for your courses."
      badge="Resources"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="gold"
              onClick={() => {
                setEditing(null);
                setShowForm((v) => !v);
              }}
            >
              + Add resource
            </Button>
          </div>

          {showForm && (
            <ResourceForm
              key={editing?.id ?? "new"}
              courses={courses}
              initial={editing ?? undefined}
              onSubmit={handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          )}

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : resources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-4xl">📎</p>
              <h2 className="mt-4 font-serif text-xl font-bold">No resources yet</h2>
              <p className="mt-2 text-muted-foreground">
                Add resources from a course edit page, or use the button above and select a course.
              </p>
              <Link href="/dashboard/teacher" className="mt-6 inline-block">
                <Button variant="secondary">Go to courses</Button>
              </Link>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <section>
                <h2 className="font-serif text-lg font-bold">Course-level ({courseResources.length})</h2>
                <div className="mt-4">
                  <ResourceList
                    resources={courseResources}
                    editable
                    onEdit={(r) => {
                      setEditing(r);
                      setShowForm(true);
                    }}
                    onDelete={handleDelete}
                  />
                </div>
              </section>
              {lessonResources.length > 0 && (
                <section>
                  <h2 className="font-serif text-lg font-bold">Lesson resources ({lessonResources.length})</h2>
                  <div className="mt-4">
                    <ResourceList
                      resources={lessonResources}
                      editable
                      onEdit={(r) => {
                        setEditing(r);
                        setShowForm(true);
                      }}
                      onDelete={handleDelete}
                    />
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
