import type { Quality } from "@/lib/api";

const OPTIONS: { value: Quality; label: string }[] = [
  { value: "480", label: "480p" },
  { value: "720", label: "HD" },
  { value: "1080", label: "FHD" },
  { value: "1440", label: "2K" },
  { value: "2160", label: "4K" },
];

type Props = {
  quality: Quality;
  onChange: (q: Quality) => void;
  fit: boolean;
  onFitChange: (fit: boolean) => void;
  sourceSize: { width: number; height: number } | null;
};

const seg = (active: boolean) =>
  `rounded-md py-1.5 text-[10px] font-bold transition ${
    active ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:bg-slate-800"
  }`;

export default function QualityControl({ quality, onChange, fit, onFitChange, sourceSize }: Props) {
  const maxQ = sourceSize ? Math.min(sourceSize.width, sourceSize.height) : null;
  return (
    <div className="space-y-3 border-t border-slate-800/60 pt-3">
      <div className="space-y-2">
        <span className="text-xs font-medium text-slate-300">Download Quality</span>
        <div className="grid grid-cols-5 gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={quality === o.value}
              onClick={() => onChange(o.value)}
              className={`${seg(quality === o.value)} ${maxQ && Number(o.value) > maxQ ? "opacity-40" : ""}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-500">
          {sourceSize
            ? `Source: ${sourceSize.width}×${sourceSize.height}. Output is limited to ${maxQ}p (dimmed options are above the source).`
            : "Output can't be higher than the original video. Preview is 480p."}
        </p>
      </div>
      <div className="space-y-2">
        <span className="text-xs font-medium text-slate-300">Frame Mode</span>
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
          <button type="button" aria-pressed={!fit} onClick={() => onFitChange(false)} className={seg(!fit)}>
            Fill (crop)
          </button>
          <button type="button" aria-pressed={fit} onClick={() => onFitChange(true)} className={seg(fit)}>
            Fit (sharp + blur bars)
          </button>
        </div>
      </div>
    </div>
  );
}
