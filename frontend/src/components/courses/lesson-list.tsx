"use client";

import { useState } from "react";
import type { Lesson } from "@/types/course";
import { formatDuration } from "@/types/course";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LessonVideoField, type LessonVideoValue } from "@/components/courses/lesson-video-field";
import { ProtectedVideo } from "@/components/media/protected-video";
import { formatFileSize } from "@/lib/format-file-size";
import {
  hasUploadedVideo,
  isCloudStoredVideo,
  resolveVideoPlaybackUrl,
} from "@/lib/video-upload-utils";

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
      videoStorageProvider?: string | null;
      videoStorageKey?: string | null;
      duration?: number;
    },
  ) => void | Promise<void>;
}

function lessonToVideoValue(lesson: Lesson): LessonVideoValue {
  return {
    videoUrl: lesson.videoUrl ?? "",
    videoFileName: lesson.videoFileName ?? null,
    videoMimeType: lesson.videoMimeType ?? null,
    videoSize: lesson.videoSize ?? null,
    videoStorageProvider: lesson.videoStorageProvider ?? null,
    videoStorageKey: lesson.videoStorageKey ?? null,
  };
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
    videoStorageProvider: null,
    videoStorageKey: null,
  });
  const [editDuration, setEditDuration] = useState("0");

  function startEdit(lesson: Lesson) {
    setEditingId(lesson.id);
    setEditTitle(lesson.title);
    setEditDescription(lesson.description ?? "");
    setEditVideo(lessonToVideoValue(lesson));
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
      videoStorageProvider: editVideo.videoStorageProvider,
      videoStorageKey: editVideo.videoStorageKey,
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
        const hasVideo = Boolean(lesson.videoUrl?.trim());
        const uploaded = hasVideo && hasUploadedVideo(lessonToVideoValue(lesson));
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
                <LessonVideoField value={editVideo} onChange={setEditVideo} />
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
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{lesson.title}</p>
                    {lesson.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {lesson.description}
                      </p>
                    )}
                    {hasVideo && (
                      <div className="mt-2 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
                            ▶ Video
                          </span>
                          {uploaded && isCloudStoredVideo(lessonToVideoValue(lesson)) && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                              Cloud ({lesson.videoStorageProvider?.toUpperCase() ?? "R2"})
                            </span>
                          )}
                          <span className="truncate text-muted-foreground">
                            {lesson.videoFileName ?? "Video attached"}
                            {lesson.videoSize ? ` · ${formatFileSize(lesson.videoSize)}` : ""}
                          </span>
                        </div>
                        {uploaded && lesson.videoUrl && (
                          <ProtectedVideo
                            src={
                              resolveVideoPlaybackUrl(lessonToVideoValue(lesson)) ??
                              lesson.videoUrl
                            }
                            fileName={lesson.videoFileName ?? undefined}
                            storageProvider={lesson.videoStorageProvider ?? undefined}
                            className="max-h-24 w-full max-w-xs rounded-lg bg-black object-contain"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(lesson.duration)}
                  </span>
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
