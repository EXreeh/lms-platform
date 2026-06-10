"use client";

import Link from "next/link";
import type { LiveClass } from "@/types/institute";
import { JoinLiveClassButton } from "./join-live-class-button";
import { RecordingPlayer } from "./recording-player";

interface LiveClassCardProps {
  liveClass: LiveClass;
  detailHref?: string;
  showRecordings?: boolean;
}

export function LiveClassCard({ liveClass, detailHref, showRecordings = true }: LiveClassCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {detailHref ? (
            <Link href={detailHref} className="font-semibold text-foreground hover:text-primary">
              {liveClass.title}
            </Link>
          ) : (
            <p className="font-semibold text-foreground">{liveClass.title}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {liveClass.courseTitle} · {liveClass.batchName}
          </p>
          <p className="text-sm text-muted-foreground">Teacher: {liveClass.teacherName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(liveClass.scheduledAt).toLocaleString()} · {liveClass.durationMinutes} min ·{" "}
            <span className="font-medium uppercase">{liveClass.status}</span>
          </p>
          {liveClass.meetingProvider ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Provider: {liveClass.meetingProvider.replace("_", " ")}
            </p>
          ) : null}
        </div>
        <JoinLiveClassButton liveClass={liveClass} />
      </div>

      {showRecordings && liveClass.status === "COMPLETED" && liveClass.recordings?.length ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium">Batch recordings</p>
          {liveClass.recordings.map((r) => (
            <div key={r.id} className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium">{r.title}</p>
              <RecordingPlayer
                recording={{
                  title: r.title,
                  videoUrl: r.videoUrl,
                  videoStorageKey: null,
                  videoStorageProvider: "r2",
                  videoMimeType: "video/mp4",
                  videoFileName: r.title,
                }}
                className="mt-2 max-h-40 w-full rounded-lg bg-black object-contain"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
