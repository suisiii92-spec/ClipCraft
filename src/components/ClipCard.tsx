import { useState } from "react";
import { ClipCaption } from "@/components/ClipCaption";
import ClipStyleControls from "@/components/ClipStyleControls";
import ServerClipPlayer from "@/components/ServerClipPlayer";
import { clipUrl, downloadClip, type Quality } from "@/lib/api";
import { clipTitle, formatTime, type ClipPlan, type ClipSource } from "@/lib/clips";
import { toCssAspectRatio, type ClipStyle } from "@/lib/clipStyle";

type Props = {
  clip: ClipPlan;
  source: ClipSource;
  quality: Quality;
  fit: boolean;
  style: ClipStyle;
  onStyleChange: (patch: Partial<ClipStyle>) => void;
};

export default function ClipCard({ clip, source, quality, fit, style, onStyleChange }: Props) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);
  const aspectRatio = toCssAspectRatio(style.aspectRatio);
  const args = { id: source.id, start: clip.start, end: clip.end, ratio: style.aspectRatio, quality, fit };

  const handleDownload = async () => {
    setBusy(true);
    setDlError(null);
    try {
      await downloadClip(args);
    } catch (e) {
      setDlError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  };

  const caption = (
    <ClipCaption
      text={style.captionText}
      size={style.captionSize}
      color={style.captionColor}
      position={style.captionPosition}
      background={style.captionBackground}
    />
  );

  return (
    <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-2xl">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-slate-100">Clip #{clip.index} ({clipTitle(clip.index)})</span>
        <span className="rounded-full border border-purple-800/60 bg-purple-950/80 px-2 py-0.5 font-mono text-[11px] font-bold text-purple-300">
          {formatTime(clip.start)} - {formatTime(clip.end)}
        </span>
      </div>

      <ServerClipPlayer
        key={`${clip.start}-${clip.end}-${style.aspectRatio}-${fit}`}
        src={(retry) => clipUrl({ ...args, preview: true, retry })}
        aspectRatio={aspectRatio}
        overlay={caption}
      />

      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
      >
        {busy ? "Processing clip..." : `↓ Download Clip #${clip.index}`}
      </button>
      {dlError && <p className="text-xs text-red-400">{dlError}</p>}

      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-expanded={isCustomizing}
          onClick={() => setIsCustomizing((o) => !o)}
          className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:border-purple-500 hover:text-white"
        >
          {isCustomizing ? "Hide style" : "Customize style"}
        </button>
        <span className="text-[11px] font-bold text-emerald-400">Viral Score: {clip.score}%</span>
      </div>

      {isCustomizing && <ClipStyleControls style={style} onChange={onStyleChange} />}
    </article>
  );
}
