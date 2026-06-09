"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileUploadZone, type UploadedFileInfo } from "@/components/uploads/file-upload-zone";
import type { Resource, ResourceType } from "@/types/resource";
import { RESOURCE_TYPE_LABELS } from "@/types/resource";
import { inferResourceTypeFromMime } from "@/lib/uploads-api";
import { getMaxResourceBytes, maxSizeLabelForKind } from "@/lib/upload-config";

export interface ResourceFormPayload {
  title: string;
  description?: string;
  type: ResourceType;
  url: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  storageProvider?: string;
  courseId: string;
  lessonId?: string | null;
}

interface ResourceFormProps {
  courseId?: string;
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
    mimeType: initial?.mimeType ?? "",
    fileSize: initial?.fileSize ?? undefined,
    storageProvider: initial?.storageProvider ?? "local",
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
  const [mimeType, setMimeType] = useState(initial?.mimeType ?? "");
  const [fileSize, setFileSize] = useState<number | undefined>(initial?.fileSize ?? undefined);
  const [storageProvider, setStorageProvider] = useState(initial?.storageProvider ?? "local");
  const [urlMode, setUrlMode] = useState(
    Boolean(initial?.url && !initial.url.startsWith("/uploads/resources/")),
  );
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
  const hasResource = Boolean(url.trim());
  const canSubmit =
    Boolean(title.trim()) &&
    hasResource &&
    Boolean(resolvedCourseId) &&
    !isSaving &&
    (!needsCoursePicker || courses!.length > 0);

  const uploaded: UploadedFileInfo | null =
    url && url.startsWith("/uploads/resources/")
      ? {
          url,
          fileName: fileName || "resource",
          size: fileSize,
          mimeType: mimeType || undefined,
        }
      : null;

  function resetForm() {
    const empty = emptyFormState(lessonId);
    setTitle(empty.title);
    setDescription(empty.description);
    setType(empty.type);
    setUrl(empty.url);
    setFileName(empty.fileName);
    setMimeType(empty.mimeType);
    setFileSize(empty.fileSize);
    setStorageProvider(empty.storageProvider);
    setAttachLessonId(empty.attachLessonId);
    setUrlMode(false);
    if (!fixedCourseId) {
      setSelectedCourseId("");
    }
    setCourseError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) return;

    if (!resolvedCourseId) {
      setCourseError(COURSE_REQUIRED_MESSAGE);
      return;
    }

    if (!url.trim()) {
      setCourseError("Upload a file or paste a resource link.");
      return;
    }

    setCourseError(null);

    const payload: ResourceFormPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      url: url.trim(),
      fileName: fileName.trim() || undefined,
      mimeType: mimeType || undefined,
      fileSize,
      storageProvider,
      courseId: resolvedCourseId,
      lessonId: attachLessonId.trim() ? attachLessonId.trim() : null,
    };

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

      <FileUploadZone
        kind="resource"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.webp,.gif,.txt,application/pdf,image/*"
        label="Resource file"
        hint="PDF, Word, PowerPoint, ZIP, images, or assignment files"
        maxSizeLabel={maxSizeLabelForKind("resource")}
        maxBytes={getMaxResourceBytes()}
        uploaded={uploaded}
        showUrlFallback
        urlMode={urlMode}
        onUrlModeChange={(mode) => {
          setUrlMode(mode);
          if (mode) {
            setFileName("");
            setMimeType("");
            setFileSize(undefined);
            setStorageProvider("local");
          }
        }}
        urlValue={urlMode ? url : ""}
        onUrlChange={(nextUrl) => {
          setUrl(nextUrl);
          setStorageProvider("local");
        }}
        urlFallbackPlaceholder="https://drive.google.com/... or any resource link"
        onUploaded={(result) => {
          setUrl(result.publicUrl ?? result.url);
          setFileName(result.fileName);
          setMimeType(result.mimeType);
          setFileSize(result.size);
          setStorageProvider(result.storageProvider);
          setType(inferResourceTypeFromMime(result.mimeType));
          setUrlMode(false);
        }}
        onClear={() => {
          setUrl("");
          setFileName("");
          setMimeType("");
          setFileSize(undefined);
        }}
      />

      {courseError && <p className="text-sm text-red-600 dark:text-red-400">{courseError}</p>}

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
