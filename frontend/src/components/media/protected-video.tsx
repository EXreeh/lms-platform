"use client";

import { forwardRef } from "react";
import type { VideoHTMLAttributes } from "react";

interface ProtectedVideoProps extends VideoHTMLAttributes<HTMLVideoElement> {
  showProtectionNote?: boolean;
}

export const ProtectedVideo = forwardRef<HTMLVideoElement, ProtectedVideoProps>(
  function ProtectedVideo(
    { showProtectionNote = false, className, onContextMenu, ...props },
    ref,
  ) {
    return (
      <div className="w-full space-y-2">
        <video
          {...props}
          ref={ref}
          className={className}
          controls
          controlsList="nodownload"
          disablePictureInPicture
          playsInline
          onContextMenu={(event) => {
            event.preventDefault();
            onContextMenu?.(event);
          }}
        />
        {showProtectionNote ? (
          <p className="px-1 text-xs text-muted-foreground">
            Video content is protected and available for streaming only.
          </p>
        ) : null}
      </div>
    );
  },
);
