"use client";

import { forwardRef, useEffect, useState } from "react";
import type { VideoHTMLAttributes } from "react";
import { logVideoDebug, videoErrorLabel } from "@/lib/video-debug";
import { isPrivateR2Url, isUploadedMediaUrl, resolvePublicMediaUrl } from "@/lib/media-url-utils";

interface ProtectedVideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, "src"> {
  src: string;
  fileName?: string;
  storageProvider?: string;
  showProtectionNote?: boolean;
  showPlaceholder?: boolean;
}

function VideoErrorFallback({
  className,
  fileName,
}: {
  className?: string;
  fileName?: string;
}) {
  return (
    <div
      className={`flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-muted px-4 text-center ${className ?? ""}`}
    >
      <p className="text-3xl" aria-hidden>
        🎬
      </p>
      <p className="text-sm font-medium text-foreground">
        Video could not be loaded. Please contact admin.
      </p>
      {fileName ? (
        <p className="max-w-full truncate text-xs text-muted-foreground">{fileName}</p>
      ) : null}
    </div>
  );
}

export const ProtectedVideo = forwardRef<HTMLVideoElement, ProtectedVideoProps>(
  function ProtectedVideo(
    {
      src,
      fileName,
      storageProvider,
      showProtectionNote = false,
      showPlaceholder = true,
      className,
      onContextMenu,
      onError,
      onLoadedData,
      onPlay,
      ...props
    },
    ref,
  ) {
    const [hasError, setHasError] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [posterDismissed, setPosterDismissed] = useState(false);

    const playbackSrc = resolvePublicMediaUrl(src) ?? src;

    useEffect(() => {
      setHasError(false);
      setIsPlaying(false);
      setHasLoaded(false);
      setPosterDismissed(false);
      logVideoDebug("video src", { src, playbackSrc, fileName, storageProvider });
    }, [src, playbackSrc, fileName, storageProvider]);

    if (!src?.trim()) {
      return (
        <div
          className={`flex aspect-video items-center justify-center rounded-xl bg-muted ${className ?? ""}`}
        >
          <p className="text-sm text-muted-foreground">No video source</p>
        </div>
      );
    }

    if (hasError || isPrivateR2Url(playbackSrc)) {
      return <VideoErrorFallback className={className} fileName={fileName} />;
    }

    const isCloudUrl =
      storageProvider === "r2" ||
      storageProvider === "s3" ||
      /\/videos\//i.test(playbackSrc);

    const showPosterOverlay =
      showPlaceholder &&
      !posterDismissed &&
      !isPlaying &&
      !hasLoaded &&
      Boolean(fileName || storageProvider || isUploadedMediaUrl(playbackSrc));

    return (
      <div className="w-full space-y-2">
        <div className="relative">
          {showPosterOverlay ? (
            <button
              type="button"
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-muted/95 px-4 text-center"
              onClick={() => setPosterDismissed(true)}
              aria-label="Show video player"
            >
              <p className="text-4xl" aria-hidden>
                🎬
              </p>
              {fileName ? (
                <p className="max-w-full truncate text-sm font-semibold text-foreground">
                  {fileName}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">Uploaded video</p>
              {isCloudUrl ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Cloud ({storageProvider?.toUpperCase() ?? "R2"})
                </span>
              ) : null}
              <span className="mt-1 text-xs text-primary">Tap to play</span>
            </button>
          ) : null}
          <video
            {...props}
            ref={ref}
            src={playbackSrc}
            className={className}
            controls
            controlsList="nodownload"
            disablePictureInPicture
            playsInline
            preload="metadata"
            onContextMenu={(event) => {
              event.preventDefault();
              onContextMenu?.(event);
            }}
            onPlay={(event) => {
              setIsPlaying(true);
              setPosterDismissed(true);
              onPlay?.(event);
            }}
            onLoadedData={(event) => {
              setHasLoaded(true);
              onLoadedData?.(event);
            }}
            onError={(event) => {
              const media = event.currentTarget;
              const code = media.error?.code ?? 0;
              logVideoDebug("video error", {
                src: playbackSrc,
                code,
                label: videoErrorLabel(code),
                message: media.error?.message,
              });
              setHasError(true);
              onError?.(event);
            }}
          />
        </div>
        {showProtectionNote ? (
          <p className="px-1 text-xs text-muted-foreground">
            Video content is protected and available for streaming only.
          </p>
        ) : null}
      </div>
    );
  },
);
