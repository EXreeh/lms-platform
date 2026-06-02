"use client";

import { useState } from "react";
import { FileUploadZone, type UploadedFileInfo } from "@/components/uploads/file-upload-zone";
import { getMaxVideoBytes, maxSizeLabelForKind } from "@/lib/upload-config";

export interface LessonVideoValue {
  videoUrl: string;
  videoFileName?: string | null;
  videoMimeType?: string | null;
  videoSize?: number | null;
}

interface LessonVideoFieldProps {
  value: LessonVideoValue;
  onChange: (value: LessonVideoValue) => void;
  disabled?: boolean;
}

export function LessonVideoField({ value, onChange, disabled }: LessonVideoFieldProps) {
  const [urlMode, setUrlMode] = useState(
    Boolean(value.videoUrl && !value.videoUrl.startsWith("/uploads/videos/")),
  );

  const uploaded: UploadedFileInfo | null =
    value.videoUrl && value.videoUrl.startsWith("/uploads/videos/")
      ? {
          url: value.videoUrl,
          fileName: value.videoFileName ?? "video",
          size: value.videoSize ?? undefined,
          mimeType: value.videoMimeType ?? undefined,
        }
      : null;

  return (
    <FileUploadZone
      kind="video"
      accept=".mp4,.mov,.webm,.mkv,video/mp4,video/quicktime,video/webm,video/x-matroska"
      label="Lesson video"
      hint="MP4, MOV, WebM, or MKV from your laptop or phone"
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
        })
      }
      urlFallbackPlaceholder="https://youtube.com/watch?v=... or direct video URL"
      previewType="video"
      onUploaded={(result) => {
        onChange({
          videoUrl: result.url,
          videoFileName: result.fileName,
          videoMimeType: result.mimeType,
          videoSize: result.size,
        });
        setUrlMode(false);
      }}
      onClear={() =>
        onChange({
          videoUrl: "",
          videoFileName: null,
          videoMimeType: null,
          videoSize: null,
        })
      }
    />
  );
}
