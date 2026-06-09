"use client";

import { useState } from "react";
import { FileUploadZone, type UploadedFileInfo } from "@/components/uploads/file-upload-zone";
import { getMaxVideoBytes, maxSizeLabelForKind } from "@/lib/upload-config";
import { getVideoDurationFromFile } from "@/lib/uploads-api";
import { logLessonDebug } from "@/lib/lesson-debug";
import {
  hasUploadedVideo,
  isCloudStoredVideo,
  isExternalVideoUrl,
  resolveVideoPlaybackUrl,
} from "@/lib/video-upload-utils";

export interface LessonVideoValue {
  videoUrl: string;
  videoFileName?: string | null;
  videoMimeType?: string | null;
  videoSize?: number | null;
  videoStorageProvider?: string | null;
  videoStorageKey?: string | null;
}

interface LessonVideoFieldProps {
  value: LessonVideoValue;
  onChange: (value: LessonVideoValue) => void;
  onDurationDetected?: (seconds: number) => void;
  disabled?: boolean;
}

function toUploadedInfo(value: LessonVideoValue): UploadedFileInfo | null {
  if (!hasUploadedVideo(value)) return null;
  const playbackUrl = resolveVideoPlaybackUrl(value) ?? value.videoUrl;
  return {
    url: playbackUrl,
    fileName: value.videoFileName ?? "video",
    size: value.videoSize ?? undefined,
    mimeType: value.videoMimeType ?? undefined,
    storageProvider: value.videoStorageProvider ?? undefined,
    storageKey: value.videoStorageKey ?? undefined,
  };
}

export function LessonVideoField({
  value,
  onChange,
  onDurationDetected,
  disabled,
}: LessonVideoFieldProps) {
  const [urlMode, setUrlMode] = useState(
    Boolean(value.videoUrl && isExternalVideoUrl(value.videoUrl)),
  );

  const uploaded = toUploadedInfo(value);

  return (
    <FileUploadZone
      kind="video"
      accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
      label="Lesson video"
      hint="MP4, MOV, or WebM from your laptop or phone"
      maxSizeLabel={maxSizeLabelForKind("video")}
      maxBytes={getMaxVideoBytes()}
      disabled={disabled}
      uploaded={uploaded}
      showUrlFallback
      urlMode={urlMode}
      onUrlModeChange={setUrlMode}
      urlValue={urlMode ? value.videoUrl : ""}
      onUrlChange={(url) =>
        onChange({
          videoUrl: url,
          videoFileName: null,
          videoMimeType: null,
          videoSize: null,
          videoStorageProvider: null,
          videoStorageKey: null,
        })
      }
      urlFallbackPlaceholder="https://youtube.com/watch?v=... or direct video URL"
      previewType="video"
      onUploaded={(result, sourceFile) => {
        const playbackUrl = result.publicUrl ?? result.url;
        logLessonDebug("video upload response", {
          url: result.url,
          publicUrl: playbackUrl,
          fileName: result.fileName,
          mimeType: result.mimeType,
          size: result.size,
          storageKey: result.storageKey,
          storageProvider: result.storageProvider,
        });
        onChange({
          videoUrl: playbackUrl,
          videoFileName: result.fileName,
          videoMimeType: result.mimeType,
          videoSize: result.size,
          videoStorageProvider: result.storageProvider,
          videoStorageKey: result.storageKey,
        });
        setUrlMode(false);
        if (sourceFile) {
          void getVideoDurationFromFile(sourceFile).then((seconds) => {
            if (seconds > 0) onDurationDetected?.(seconds);
          });
        }
      }}
      onClear={() =>
        onChange({
          videoUrl: "",
          videoFileName: null,
          videoMimeType: null,
          videoSize: null,
          videoStorageProvider: null,
          videoStorageKey: null,
        })
      }
      cloudBadge={
        uploaded && isCloudStoredVideo(value)
          ? `Uploaded to cloud (${value.videoStorageProvider?.toUpperCase() ?? "R2"})`
          : uploaded
            ? "Uploaded"
            : undefined
      }
    />
  );
}
