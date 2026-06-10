"use client";

import { ProtectedVideo } from "@/components/media/protected-video";
import type { LiveClassRecording } from "@/types/institute";

interface RecordingPlayerProps {
  recording: Pick<
    LiveClassRecording,
    | "videoUrl"
    | "videoStorageKey"
    | "videoStorageProvider"
    | "videoMimeType"
    | "videoFileName"
    | "title"
  >;
  className?: string;
}

export function RecordingPlayer({ recording, className }: RecordingPlayerProps) {
  return (
    <ProtectedVideo
      src={recording.videoUrl}
      videoStorageKey={recording.videoStorageKey}
      videoStorageProvider={recording.videoStorageProvider}
      mimeType={recording.videoMimeType}
      fileName={recording.videoFileName ?? recording.title}
      storageProvider={recording.videoStorageProvider ?? undefined}
      className={className ?? "aspect-video w-full rounded-xl bg-black object-contain"}
      showProtectionNote
    />
  );
}
