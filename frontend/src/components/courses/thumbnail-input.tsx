"use client";

import { useState } from "react";
import Image from "next/image";
import { FileUploadZone, type UploadedFileInfo } from "@/components/uploads/file-upload-zone";
import { getMaxThumbnailBytes, maxSizeLabelForKind } from "@/lib/upload-config";

interface ThumbnailInputProps {
  value: string;
  thumbnailFileName?: string | null;
  onChange: (url: string, meta?: { fileName?: string | null }) => void;
  disabled?: boolean;
}

export function ThumbnailInput({ value, thumbnailFileName, onChange, disabled }: ThumbnailInputProps) {
  const [urlMode, setUrlMode] = useState(false);

  const uploaded: UploadedFileInfo | null =
    value && value.startsWith("/uploads/thumbnails/")
      ? { url: value, fileName: thumbnailFileName ?? "thumbnail", size: undefined }
      : null;

  return (
    <div className="space-y-3">
      <FileUploadZone
        kind="thumbnail"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        label="Course thumbnail"
        hint="JPG, PNG, or WebP — square or 16:9 recommended"
        maxSizeLabel={maxSizeLabelForKind("thumbnail")}
        maxBytes={getMaxThumbnailBytes()}
        disabled={disabled}
        uploaded={uploaded}
        showUrlFallback
        urlMode={urlMode || (!!value && !value.startsWith("/uploads/"))}
        onUrlModeChange={setUrlMode}
        urlValue={urlMode ? value : ""}
        onUrlChange={(url) => onChange(url, { fileName: null })}
        urlFallbackPlaceholder="https://example.com/thumbnail.jpg"
        previewType="image"
        onUploaded={(result) => {
          onChange(result.url, { fileName: result.fileName });
          setUrlMode(false);
        }}
        onClear={() => onChange("", { fileName: null })}
      />
      {value && !uploaded && urlMode && value.startsWith("http") && (
        <div className="relative aspect-video max-w-xs overflow-hidden rounded-xl border border-border">
          <Image src={value} alt="Thumbnail preview" fill className="object-cover" unoptimized />
        </div>
      )}
    </div>
  );
}
