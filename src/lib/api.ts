import type { ClipPlan } from "@/lib/clips";

// Production: same origin (Flask serves the site). Dev: Flask on :8000.
const BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? `http://${location.hostname}:8000` : "");

export type Quality = "480" | "720" | "1080" | "1440" | "2160";

async function parse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export async function analyze(input: { url: string } | { file: File }, duration: number, count: number) {
  const fd = new FormData();
  fd.append("duration", String(duration));
  fd.append("count", String(count));
  if ("file" in input) fd.append("file", input.file);
  else fd.append("url", input.url);
  const data = await parse(await fetch(`${BASE}/api/analyze`, { method: "POST", body: fd }));
  return data as { id: string; width: number; height: number; clips: ClipPlan[] };
}

export async function getPlan(id: string, duration: number, count: number) {
  const data = await parse(await fetch(`${BASE}/api/plan?id=${id}&duration=${duration}&count=${count}`));
  return data.clips as ClipPlan[];
}

type ClipArgs = { id: string; start: number; end: number; ratio: string; quality: Quality; fit: boolean };

export function clipUrl(a: ClipArgs & { preview?: boolean; retry?: number }) {
  const q = new URLSearchParams({
    id: a.id, start: String(a.start), end: String(a.end), ratio: a.ratio, quality: a.quality,
    fit: a.fit ? "1" : "0", preview: a.preview ? "1" : "0", r: String(a.retry ?? 0),
  });
  return `${BASE}/api/clip?${q}`;
}

export async function downloadClip(a: ClipArgs) {
  const res = await fetch(clipUrl(a));
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Download failed");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(await res.blob());
  link.download = `clip-${a.start}-${a.end}.mp4`;
  link.click();
  URL.revokeObjectURL(link.href);
}
