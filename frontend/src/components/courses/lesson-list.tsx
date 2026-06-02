"use client";

import { useState } from "react";
import type { Lesson } from "@/types/course";
import { formatDuration } from "@/types/course";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LessonVideoField, type LessonVideoValue } from "@/components/courses/lesson-video-field";
import { formatFileSize } from "@/lib/format-file-size";

interface LessonListProps {
  lessons: Lesson[];
  editable?: boolean;
  onDeleteLesson?: (lessonId: string) => void;
  onUpdateLesson?: (
    lessonId: string,
    data: {
      title: string;
      description?: string;
      videoUrl?: string;
      videoFileName?: string | null;
      videoMimeType?: string | null;
      videoSize?: number | null;
      duration?: number;
    },
  ) => void | Promise<void>;
}

export function LessonList({ lessons, editable, onDeleteLesson, onUpdateLesson }: LessonListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVideo, setEditVideo] = useState<LessonVideoValue>({
    videoUrl: "",
    videoFileName: null,
    videoMimeType: null,
    videoSize: null,
  });
  const [editDuration, setEditDuration] = useState("0");

  function startEdit(lesson: Lesson) {
    setEditingId(lesson.id);
    setEditTitle(lesson.title);
    setEditDescription(lesson.description ?? "");
    setEditVideo({
      videoUrl: lesson.videoUrl ?? "",
      videoFileName: lesson.videoFileName ?? null,
      videoMimeType: lesson.videoMimeType ?? null,
      videoSize: lesson.videoSize ?? null,
    });
    setEditDuration(String(lesson.duration ?? 0));
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(lessonId: string) {
    if (!onUpdateLesson || !editTitle.trim()) return;
    await onUpdateLesson(lessonId, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      videoUrl: editVideo.videoUrl.trim() || undefined,
      videoFileName: editVideo.videoFileName,
      videoMimeType: editVideo.videoMimeType,
      videoSize: editVideo.videoSize,
      duration: parseInt(editDuration, 10) || 0,
    });
    setEditingId(null);
  }

  if (lessons.length === 0) {
    return (
      <p className="py-3 text-center text-sm text-muted-foreground">No lessons in this module.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {lessons.map((lesson, index) => {
        const isEditing = editingId === lesson.id;
        return (
          <li key={lesson.id} className="rounded-lg bg-muted/40 px-4 py-3">
            {isEditing ? (
              <div className="space-y-3">
                <Input label="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm"
                  />
                </div>
                <LessonVideoField
                  value={editVideo}
                  onChange={setEditVideo}
                />
                <Input
                  label="Duration (seconds)"
                  type="number"
                  min="0"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => void saveEdit(lesson.id)}>
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{lesson.title}</p>
                    {lesson.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{lesson.description}</p>
                    )}
                    {lesson.videoUrl && (
                      <p className="truncate text-xs text-muted-foreground">
                        {lesson.videoFileName ?? lesson.videoUrl}
                        {lesson.videoSize ? ` · ${formatFileSize(lesson.videoSize)}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatDuration(lesson.duration)}</span>
                  {editable && onUpdateLesson && (
                    <button
                      type="button"
                      onClick={() => startEdit(lesson)}
                      className="rounded px-2 py-1 text-xs text-foreground hover:bg-muted"
                    >
                      Edit
                    </button>
                  )}
                  {editable && onDeleteLesson && (
                    <button
                      type="button"
                      onClick={() => onDeleteLesson(lesson.id)}
                      className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
