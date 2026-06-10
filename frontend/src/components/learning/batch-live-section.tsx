"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RecordingPlayer } from "@/components/live-classes/recording-player";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchStudentCourseBatchRecordings,
  fetchStudentLiveClasses,
} from "@/lib/live-classes-api";
import type { LiveClass, LiveClassRecording } from "@/types/institute";

interface BatchLiveSectionProps {
  courseId: string;
}

export function BatchLiveSection({ courseId }: BatchLiveSectionProps) {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [recordings, setRecordings] = useState<LiveClassRecording[]>([]);
  const [batchName, setBatchName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [classesRes, recordingsRes] = await Promise.all([
          fetchStudentLiveClasses({ courseId }),
          fetchStudentCourseBatchRecordings(courseId),
        ]);
        setLiveClasses(classesRes.data.slice(0, 5));
        setRecordings(recordingsRes.data.recordings.slice(0, 5));
        setBatchName(recordingsRes.data.batch?.name ?? null);
      } catch {
        setLiveClasses([]);
        setRecordings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="sm" label="Loading batch content" />
      </div>
    );
  }

  if (!batchName && liveClasses.length === 0 && recordings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-bold">Batch Live Classes</h2>
          {batchName ? (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {batchName}
            </span>
          ) : null}
        </div>
        {liveClasses.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No live classes scheduled yet</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {liveClasses.map((c) => (
              <li key={c.id} className="rounded-xl border border-border px-4 py-3 text-sm">
                <p className="font-medium">{c.title}</p>
                <p className="text-muted-foreground">
                  {new Date(c.scheduledAt).toLocaleString()} · {c.status}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/dashboard/student/live-classes"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          View all live classes →
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-lg font-bold">Batch Recordings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Recordings for your assigned batch only
        </p>
        {recordings.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No recordings uploaded yet</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {recordings.map((r) => (
              <li key={r.id} className="rounded-xl border border-border p-4">
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.liveClassTitle}</p>
                <RecordingPlayer
                  recording={r}
                  className="mt-2 max-h-48 w-full rounded-lg bg-black object-contain"
                />
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/dashboard/student/recordings"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          View all recordings →
        </Link>
      </div>
    </div>
  );
}
