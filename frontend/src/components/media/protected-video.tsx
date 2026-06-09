"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type { VideoHTMLAttributes } from "react";
import { isVideoDebugEnabled, logVideoDebug, logVideoError, videoErrorLabel } from "@/lib/video-debug";
import { isAbsoluteVideoUrl, isPrivateR2Url, resolvePublicMediaUrl } from "@/lib/media-url-utils";

interface ProtectedVideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, "src"> {
  src: string;
  mimeType?: string | null;
  fileName?: string;
  storageProvider?: string;
  showProtectionNote?: boolean;
  showPlaceholder?: boolean;
}

function inferVideoMimeType(src: string, mimeType?: string | null): string {
  if (mimeType?.startsWith("video/")) return mimeType;
  if (/\.webm(\?|$)/i.test(src)) return "video/webm";
  if (/\.mov(\?|$)/i.test(src)) return "video/quicktime";
  return "video/mp4";
}

function VideoPlaceholderCard({
  className,
  fileName,
  storageProvider,
  playbackSrc,
  onStart,
}: {
  className?: string;
  fileName?: string;
  storageProvider?: string;
  playbackSrc: string;
  onStart: () => void;
}) {
  const isCloud =
    storageProvider === "r2" ||
    storageProvider === "s3" ||
    /\/videos\//i.test(playbackSrc);

  return (
    <button
      type="button"
      className={`flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 text-center ${className ?? ""}`}
      onClick={onStart}
      aria-label="Play uploaded video"
    >
      <p className="text-4xl" aria-hidden>
        🎬
      </p>
      {fileName ? (
        <p className="max-w-full truncate text-sm font-semibold text-foreground">{fileName}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">Uploaded video</p>
      {isCloud ? (
        <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Cloud video ({storageProvider?.toUpperCase() ?? "R2"})
        </span>
      ) : null}
      <span className="mt-1 text-xs text-primary">Tap to play</span>
      {isVideoDebugEnabled() ? (
        <p className="mt-2 max-w-full break-all text-[10px] text-muted-foreground">{playbackSrc}</p>
      ) : null}
    </button>
  );
}

function VideoErrorFallback({
  className,
  fileName,
  playbackSrc,
}: {
  className?: string;
  fileName?: string;
  playbackSrc: string;
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
      {isVideoDebugEnabled() ? (
        <p className="max-w-full break-all text-[10px] text-muted-foreground">{playbackSrc}</p>
      ) : null}
    </div>
  );
}

export const ProtectedVideo = forwardRef<HTMLVideoElement, ProtectedVideoProps>(
  function ProtectedVideo(
    {
      src,
      mimeType,
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
    const [loadAttempted, setLoadAttempted] = useState(false);
    const [hasError, setHasError] = useState(false);
    const internalRef = useRef<HTMLVideoElement>(null);

    const setVideoRef = useCallback(
      (element: HTMLVideoElement | null) => {
        internalRef.current = element;
        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref],
    );

    const playbackSrc = isAbsoluteVideoUrl(src) ? src : resolvePublicMediaUrl(src) ?? src;
    const resolvedMime = inferVideoMimeType(playbackSrc, mimeType);

    useEffect(() => {
      setLoadAttempted(false);
      setHasError(false);
      logVideoDebug("video src", {
        src,
        playbackSrc,
        mimeType: resolvedMime,
        fileName,
        storageProvider,
      });
    }, [src, playbackSrc, resolvedMime, fileName, storageProvider]);

    useEffect(() => {
      if (!loadAttempted || hasError) return;
      const el = internalRef.current;
      if (!el) return;
      void el.play().catch(() => {
        // Autoplay may be blocked; user can press play on controls.
      });
    }, [loadAttempted, hasError, playbackSrc]);

    if (!src?.trim()) {
      return (
        <div
          className={`flex aspect-video items-center justify-center rounded-xl bg-muted ${className ?? ""}`}
        >
          <p className="text-sm text-muted-foreground">No video source</p>
        </div>
      );
    }

    if (isPrivateR2Url(playbackSrc)) {
      logVideoDebug("blocked private R2 src", { playbackSrc });
      return (
        <VideoErrorFallback
          className={className}
          fileName={fileName}
          playbackSrc={playbackSrc}
        />
      );
    }

    const handleStartPlayback = () => {
      setLoadAttempted(true);
    };

    if (!loadAttempted && showPlaceholder) {
      return (
        <VideoPlaceholderCard
          className={className}
          fileName={fileName}
          storageProvider={storageProvider}
          playbackSrc={playbackSrc}
          onStart={handleStartPlayback}
        />
      );
    }

    if (loadAttempted && hasError) {
      return (
        <VideoErrorFallback
          className={className}
          fileName={fileName}
          playbackSrc={playbackSrc}
        />
      );
    }

    return (
      <div className="w-full space-y-2">
        <video
          {...props}
          ref={setVideoRef}
          className={className}
          controls
          controlsList="nodownload"
          disablePictureInPicture
          playsInline
          preload="auto"
          onContextMenu={(event) => {
            event.preventDefault();
            onContextMenu?.(event);
          }}
          onPlay={(event) => {
            onPlay?.(event);
          }}
          onLoadedData={(event) => {
            onLoadedData?.(event);
          }}
          onError={(event) => {
            const media = event.currentTarget;
            const code = media.error?.code ?? 0;
            logVideoError("video error", {
              src: playbackSrc,
              mimeType: resolvedMime,
              code,
              label: videoErrorLabel(code),
              message: media.error?.message,
            });
            setHasError(true);
            onError?.(event);
          }}
        >
          <source src={playbackSrc} type={resolvedMime} />
        </video>
        {isVideoDebugEnabled() ? (
          <p className="break-all px-1 text-[10px] text-muted-foreground">{playbackSrc}</p>
        ) : null}
        {showProtectionNote ? (
          <p className="px-1 text-xs text-muted-foreground">
            Video content is protected and available for streaming only.
          </p>
        ) : null}
      </div>
    );
  },
);
