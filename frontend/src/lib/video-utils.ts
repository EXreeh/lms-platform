import {
  isLegacyAppUploadUrl,
  resolvePublicMediaUrl,
} from "@/lib/media-url-utils";
import { resolveVideoPlaybackUrl } from "@/lib/video-upload-utils";

export function parseVideoEmbedUrl(url: string | null | undefined): {
  type: "youtube" | "vimeo" | "html5" | "none";
  embedUrl: string | null;
  videoId: string | null;
} {
  if (!url) return { type: "none", embedUrl: null, videoId: null };

  const normalized =
    resolveVideoPlaybackUrl({ videoUrl: url }) ??
    (isLegacyAppUploadUrl(url) ? resolvePublicMediaUrl(url) : null) ??
    url;

  const youtubeMatch = normalized.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return {
      type: "youtube",
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
    };
  }

  const vimeoMatch = normalized.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return {
      type: "vimeo",
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
    };
  }

  if (
    /\.(mp4|webm|ogg|mov)(\?|$)/i.test(normalized) ||
    isLegacyAppUploadUrl(normalized) ||
    /\/videos\/[\w.\-]+\.(mp4|webm|mov)(\?|$)/i.test(normalized)
  ) {
    const playback =
      resolveVideoPlaybackUrl({ videoUrl: normalized }) ??
      resolvePublicMediaUrl(normalized);
    return { type: "html5", embedUrl: playback ?? normalized, videoId: null };
  }

  return { type: "html5", embedUrl: normalized, videoId: null };
}

export function formatWatchTime(seconds: number): string {
  if (!seconds) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}
