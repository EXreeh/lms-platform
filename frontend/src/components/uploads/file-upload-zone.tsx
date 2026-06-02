"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatFileSize } from "@/lib/format-file-size";
import { formatApiError } from "@/lib/format-api-error";
import { uploadFile, type UploadKind, type UploadResult } from "@/lib/uploads-api";
import { ProtectedVideo } from "@/components/media/protected-video";
import { tooLargeClientMessage } from "@/lib/upload-config";

export interface UploadedFileInfo {
  url: string;
  fileName: string;
  mimeType?: string;
  size?: number;
}

interface FileUploadZoneProps {
  kind: UploadKind;
  accept: string;
  label: string;
  hint: string;
  maxSizeLabel: string;
  disabled?: boolean;
  uploaded?: UploadedFileInfo | null;
  onUploaded: (result: UploadResult) => void;
  onClear?: () => void;
  /** Optional URL fallback below upload area */
  showUrlFallback?: boolean;
  urlFallbackPlaceholder?: string;
  urlValue?: string;
  onUrlChange?: (url: string) => void;
  urlMode?: boolean;
  onUrlModeChange?: (useUrl: boolean) => void;
  previewType?: "image" | "video" | "none";
  /** Client-side max bytes — blocks upload before request */
  maxBytes?: number;
}

export function FileUploadZone({
  kind,
  accept,
  label,
  hint,
  maxSizeLabel,
  disabled,
  uploaded,
  onUploaded,
  onClear,
  showUrlFallback = false,
  urlFallbackPlaceholder = "https://...",
  urlValue = "",
  onUrlChange,
  urlMode = false,
  onUrlModeChange,
  previewType = "none",
  maxBytes,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      if (maxBytes != null && file.size > maxBytes) {
        setError(tooLargeClientMessage(kind, file.size));
        setSelectedName(null);
        return;
      }

      setSelectedName(file.name);
      setIsUploading(true);
      setProgress(0);
      onUrlModeChange?.(false);

      try {
        const result = await uploadFile(kind, file, setProgress);
        onUploaded(result);
        setProgress(100);
      } catch (err) {
        setError(formatApiError(err, "Upload failed. Please try again."));
        setSelectedName(null);
      } finally {
        setIsUploading(false);
      }
    },
    [kind, maxBytes, onUploaded, onUrlModeChange],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files[0];
    if (file) void processFile(file);
  }

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = "";
  }

  const showUploadArea = !urlMode || !showUrlFallback;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {showUrlFallback && onUrlModeChange && (
          <div className="flex rounded-lg border border-border p-0.5 text-xs">
            <button
              type="button"
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                !urlMode ? "gradient-brand text-white" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onUrlModeChange(false)}
              disabled={disabled || isUploading}
            >
              Upload file
            </button>
            <button
              type="button"
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                urlMode ? "gradient-brand text-white" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                onUrlModeChange(true);
                onClear?.();
              }}
              disabled={disabled || isUploading}
            >
              Paste URL
            </button>
          </div>
        )}
      </div>

      {showUploadArea && (
        <motion.div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !isUploading) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`relative rounded-2xl border-2 border-dashed p-6 transition-colors ${
            isDragging
              ? "border-green-600 bg-green-50/50 dark:border-green-400 dark:bg-green-950/20"
              : "border-border bg-muted/20 hover:border-green-600/40"
          } ${disabled ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="sr-only"
            disabled={disabled || isUploading}
            onChange={onFileSelect}
          />

          {uploaded && !isUploading ? (
            <div className="space-y-3">
              {previewType === "image" && (
                <div className="relative mx-auto aspect-video max-w-xs overflow-hidden rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploaded.url} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              {previewType === "video" && (
                <ProtectedVideo
                  src={uploaded.url}
                  className="mx-auto max-h-48 w-full max-w-lg rounded-xl bg-black object-contain"
                />
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50/80 px-4 py-3 dark:border-green-900 dark:bg-green-950/30">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-green-800 dark:text-green-300">
                    ✓ {uploaded.fileName}
                  </p>
                  {uploaded.size != null && (
                    <p className="text-xs text-green-700/80 dark:text-green-400/80">
                      {formatFileSize(uploaded.size)}
                      {uploaded.mimeType ? ` · ${uploaded.mimeType}` : ""}
                    </p>
                  )}
                </div>
                {onClear && (
                  <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={disabled}>
                    Replace
                  </Button>
                )}
              </div>
            </div>
          ) : isUploading ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Spinner size="md" />
              <p className="text-sm font-medium">Uploading {selectedName ?? "file"}…</p>
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full gradient-brand transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{progress}%</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <span className="text-3xl" aria-hidden>
                📤
              </span>
              <p className="text-sm font-medium text-foreground">
                Drag & drop or{" "}
                <button
                  type="button"
                  className="font-semibold text-green-700 underline underline-offset-2 dark:text-green-400"
                  onClick={() => inputRef.current?.click()}
                >
                  browse
                </button>
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">{hint}</p>
              <p className="text-xs text-muted-foreground">Max {maxSizeLabel}</p>
            </div>
          )}
        </motion.div>
      )}

      {showUrlFallback && urlMode && onUrlChange && (
        <input
          type="url"
          value={urlValue}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder={urlFallbackPlaceholder}
          disabled={disabled}
          className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
        />
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
