"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { parseVideoEmbedUrl } from "@/lib/video-utils";

interface VideoPlayerProps {
  videoUrl: string | null | undefined;
  title: string;
  initialWatchedDuration?: number;
  duration?: number;
  onWatchUpdate?: (watchedDuration: number) => void;
  onComplete?: () => void;
}

export function VideoPlayer({
  videoUrl,
  title,
  initialWatchedDuration = 0,
  duration = 0,
  onWatchUpdate,
  onComplete,
}: VideoPlayerProps) {
  const { type, embedUrl } = parseVideoEmbedUrl(videoUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [watched, setWatched] = useState(initialWatchedDuration);
  const lastReported = useRef(initialWatchedDuration);

  useEffect(() => {
    setWatched(initialWatchedDuration);
    lastReported.current = initialWatchedDuration;
  }, [videoUrl, initialWatchedDuration]);

  const reportProgress = useCallback(
    (seconds: number) => {
      setWatched(seconds);
      if (seconds > lastReported.current + 5) {
        lastReported.current = seconds;
        onWatchUpdate?.(seconds);
      }
      if (duration > 0 && seconds >= duration * 0.9) {
        onComplete?.();
      }
    },
    [duration, onComplete, onWatchUpdate],
  );

  useEffect(() => {
    if (type !== "youtube" && type !== "vimeo") return;

    const interval = setInterval(() => {
      reportProgress(lastReported.current + 15);
    }, 15000);

    return () => clearInterval(interval);
  }, [type, videoUrl, reportProgress]);

  if (!embedUrl) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-muted">
        <div className="text-center">
          <p className="text-4xl">🎬</p>
          <p className="mt-2 text-sm text-muted-foreground">No video available for this lesson</p>
        </div>
      </div>
    );
  }

  if (type === "html5") {
    return (
      <motion.div
        key={embedUrl}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-hidden rounded-2xl bg-black shadow-xl"
      >
        <video
          ref={videoRef}
          src={embedUrl}
          title={title}
          controls
          className="aspect-video w-full"
          onTimeUpdate={(e) => reportProgress(Math.floor(e.currentTarget.currentTime))}
          onEnded={() => {
            reportProgress(duration || Math.floor(videoRef.current?.duration ?? 0));
            onComplete?.();
          }}
        />
        <p className="bg-card px-4 py-2 text-xs text-muted-foreground">
          Watched: {Math.floor(watched)}s
          {duration > 0 ? ` / ${duration}s` : ""}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={embedUrl}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-2xl bg-black shadow-xl ring-1 ring-border"
    >
      <div className="relative aspect-video">
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <p className="bg-card px-4 py-2 text-xs text-muted-foreground">
        Progress tracked while you watch · {Math.floor(watched)}s recorded
      </p>
    </motion.div>
  );
}
