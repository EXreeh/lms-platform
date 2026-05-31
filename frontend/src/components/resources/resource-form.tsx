"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Resource, ResourceType } from "@/types/resource";
import { RESOURCE_TYPE_LABELS } from "@/types/resource";

export interface ResourceFormPayload {
  title: string;
  description?: string;
  type: ResourceType;
  url: string;
  fileName?: string;
  courseId: string;
  lessonId?: string | null;
}

interface ResourceFormProps {
  /** Set when adding from a course edit page — course cannot be changed */
  courseId?: string;
  /** Required on the general teacher resources page */
  courses?: { id: string; label: string }[];
  lessonId?: string | null;
  lessons?: { id: string; label: string }[];
  initial?: Partial<Resource>;
  onSubmit: (data: ResourceFormPayload) => Promise<void>;
  onCancel?: () => void;
}

const COURSE_REQUIRED_MESSAGE = "Please select a course before adding a resource.";

function emptyFormState(lessonId?: string | null, initial?: Partial<Resource>) {
  return {
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    type: (initial?.type ?? "LINK") as ResourceType,
    url: initial?.url ?? "",
    fileName: initial?.fileName ?? "",
    attachLessonId: lessonId ?? initial?.lessonId ?? "",
  };
}

export function ResourceForm({
  courseId: fixedCourseId,
  courses,
  lessonId,
  lessons,
  initial,
  onSubmit,
  onCancel,
}: ResourceFormProps) {
  const isEditing = Boolean(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<ResourceType>(initial?.type ?? "LINK");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [fileName, setFileName] = useState(initial?.fileName ?? "");
  const [selectedCourseId, setSelectedCourseId] = useState(
    fixedCourseId ?? initial?.courseId ?? "",
  );
  const [attachLessonId, setAttachLessonId] = useState(lessonId ?? initial?.lessonId ?? "");
  const [courseError, setCourseError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (fixedCourseId) {
      setSelectedCourseId(fixedCourseId);
    }
  }, [fixedCourseId]);

  const resolvedCourseId = (fixedCourseId ?? selectedCourseId).trim();
  const needsCoursePicker = !fixedCourseId && Boolean(courses);
  const canSubmit =
    Boolean(title.trim()) &&
    Boolean(url.trim()) &&
    Boolean(resolvedCourseId) &&
    !isSaving &&
    (!needsCoursePicker || courses!.length > 0);

  function resetForm() {
    const empty = emptyFormState(lessonId);
    setTitle(empty.title);
    setDescription(empty.description);
    setType(empty.type);
    setUrl(empty.url);
    setFileName(empty.fileName);
    setAttachLessonId(empty.attachLessonId);
    if (!fixedCourseId) {
      setSelectedCourseId("");
    }
    setCourseError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !url.trim()) return;

    if (!resolvedCourseId) {
      setCourseError(COURSE_REQUIRED_MESSAGE);
      return;
    }

    setCourseError(null);

    const payload: ResourceFormPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      url: url.trim(),
      fileName: fileName.trim() || undefined,
      courseId: resolvedCourseId,
      lessonId: attachLessonId.trim() ? attachLessonId.trim() : null,
    };

    console.log("Resource payload:", payload);

    setIsSaving(true);
    try {
      await onSubmit(payload);
      if (!isEditing) {
        resetForm();
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
      {needsCoursePicker && (
        <div className="space-y-1.5">
          <Select
            label="Course"
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              if (e.target.value) setCourseError(null);
            }}
            required
            options={[
              { value: "", label: "Select a course" },
              ...(courses ?? []).map((c) => ({ value: c.id, label: c.label })),
            ]}
          />
          {courses!.length === 0 && (
            <p className="text-sm text-muted-foreground">Create a course before adding resources.</p>
          )}
          {courseError && <p className="text-sm text-red-600 dark:text-red-400">{courseError}</p>}
        </div>
      )}

      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm"
        />
      </div>
      <Select
        label="Type"
        value={type}
        onChange={(e) => setType(e.target.value as ResourceType)}
        options={Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
      />
      <Input label="Resource URL" value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://..." />
      <Input label="Display file name (optional)" value={fileName} onChange={(e) => setFileName(e.target.value)} />
      {lessons && lessons.length > 0 && !lessonId && (
        <Select
          label="Attach to lesson (optional)"
          value={attachLessonId}
          onChange={(e) => setAttachLessonId(e.target.value)}
          options={[
            { value: "", label: "Course-level resource" },
            ...lessons.map((l) => ({ value: l.id, label: l.label })),
          ]}
        />
      )}
      <div className="flex gap-2">
        <Button type="submit" variant="gold" size="sm" disabled={!canSubmit}>
          {isSaving ? "Saving…" : isEditing ? "Update resource" : "Add resource"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
