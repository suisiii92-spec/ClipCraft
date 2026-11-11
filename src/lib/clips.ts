export type SourceMode = "youtube" | "local";
export type ClipSource = { id: string; kind: SourceMode; width: number; height: number };
export type ClipPlan = { index: number; score: number; start: number; end: number };

const TITLES = ["Best Hook", "High Retention", "Key Takeaway"];
export const clipTitle = (index: number) => TITLES[index - 1] ?? `Clip ${index}`;

export function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
