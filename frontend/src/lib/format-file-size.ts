/**
 * Human-readable file size (binary units: KB, MB, GB).
 * Examples: 524288000 → "500 MB", 2147483648 → "2 GB"
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes >= GB) {
    const gb = bytes / GB;
    if (gb >= 10) return `${Math.round(gb)} GB`;
    const rounded = Math.round(gb * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded} GB` : `${rounded.toFixed(1)} GB`;
  }

  if (bytes >= MB) {
    const mb = bytes / MB;
    if (mb >= 100) return `${Math.round(mb)} MB`;
    const rounded = Math.round(mb * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded} MB` : `${rounded.toFixed(1)} MB`;
  }

  if (bytes >= KB) {
    const kb = bytes / KB;
    return `${kb >= 100 ? Math.round(kb) : kb.toFixed(1)} KB`;
  }

  return `${bytes} B`;
}
