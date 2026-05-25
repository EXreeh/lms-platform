"use client";

import type { Lesson } from "@/types/course";
import { formatDuration } from "@/types/course";

interface LessonListProps {
  lessons: Lesson[];
  editable?: boolean;
  onDeleteLesson?: (lessonId: string) => void;
}

export function LessonList({ lessons, editable, onDeleteLesson }: LessonListProps) {
  if (lessons.length === 0) {
    return (
      <p className="py-3 text-center text-sm text-muted-foreground">No lessons in this module.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {lessons.map((lesson, index) => (
        <li
          key={lesson.id}
          className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-4 py-3"
        >
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
                <p className="truncate text-xs text-muted-foreground">{lesson.videoUrl}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatDuration(lesson.duration)}</span>
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
        </li>
      ))}
    </ul>
  );
}
