"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ResourceList } from "@/components/resources/resource-list";
import { ResourceForm, type ResourceFormPayload } from "@/components/resources/resource-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchCourseResources,
  createResource,
  updateResource,
  deleteResource,
} from "@/lib/resources-api";
import { activeCurriculumModules } from "@/lib/course-curriculum";
import { formatApiError } from "@/lib/format-api-error";
import type { Course } from "@/types/course";
import type { Resource } from "@/types/resource";
import { useToast } from "@/context/toast-context";

interface CourseResourcesSectionProps {
  course: Course;
  disabled?: boolean;
}

export function CourseResourcesSection({ course, disabled }: CourseResourcesSectionProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);

  const lessons = activeCurriculumModules(course.modules).flatMap((m) =>
    m.lessons.map((l) => ({ id: l.id, label: `${m.title} · ${l.title}` })),
  );

  const load = useCallback(async () => {
    try {
      const res = await fetchCourseResources(course.id);
      setResources(res.data?.resources ?? []);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load resources"));
    } finally {
      setIsLoading(false);
    }
  }, [course.id, toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(data: ResourceFormPayload) {
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
    if (!confirm("Remove this resource?")) return;
    try {
      const res = await deleteResource(resource.id);
      toastSuccess(res.message);
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Delete failed"));
    }
  }

  return (
    <section className={`rounded-2xl border border-border bg-card p-6 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-lg font-bold">Course resources</h2>
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm((v) => !v)}>
          + Add resource
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Share PDFs, links, notes, and assignments with enrolled students.
      </p>

      {showForm && (
        <div className="mt-4">
          <ResourceForm
            key={editing?.id ?? "new"}
            courseId={course.id}
            lessons={lessons}
            initial={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ResourceList
              resources={resources}
              editable
              onEdit={(r) => {
                setEditing(r);
                setShowForm(true);
              }}
              onDelete={handleDelete}
              emptyMessage="No course-level resources. Add links, PDFs, or notes above."
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}
