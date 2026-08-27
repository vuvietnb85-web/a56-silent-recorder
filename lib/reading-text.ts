export function getAdaptiveReadingFontSize(text: string): number {
  const length = text.trim().length;
  if (length <= 72) return 26;
  if (length <= 150) return 23;
  if (length <= 270) return 20;
  if (length <= 430) return 18;
  if (length <= 680) return 16;
  return 14;
}

export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function formatByteSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

