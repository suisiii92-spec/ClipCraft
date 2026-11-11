import { Film, Upload, Youtube } from "lucide-react";
import type { SourceMode } from "@/lib/clips";

type Props = {
  mode: SourceMode;
  onModeChange: (m: SourceMode) => void;
  youtubeInput: string;
  onYoutubeInputChange: (v: string) => void;
  fileName: string | null;
  onFileChange: (f: File | null) => void;
  error: string | null;
  onProcess: () => void;
};

const TAB = "flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition";
const on = "bg-purple-600 text-white shadow-md";
const off = "text-slate-400 hover:text-slate-200";

export default function SourceSelector(p: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Select Input Source Mode</h2>
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-1">
        <button type="button" onClick={() => p.onModeChange("youtube")} className={`${TAB} ${p.mode === "youtube" ? on : off}`}>
          <Youtube size={14} /> YouTube URL
        </button>
        <button type="button" onClick={() => p.onModeChange("local")} className={`${TAB} ${p.mode === "local" ? on : off}`}>
          <Film size={14} /> Local Device File
        </button>
      </div>

      {p.mode === "youtube" ? (
        <div className="relative">
          <input
            type="url"
            value={p.youtubeInput}
            onChange={(e) => p.onYoutubeInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") p.onProcess(); }}
            placeholder="Paste Video Link here..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-3.5 pr-28 text-xs text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={p.onProcess}
            className="absolute bottom-1.5 right-1.5 top-1.5 rounded-lg bg-purple-600 px-3 text-xs font-semibold text-white shadow-md transition hover:bg-purple-500"
          >
            Process Video
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/40 p-5 transition hover:border-purple-500">
            <Upload size={18} className="mb-2 text-slate-400" />
            <span className="mb-1 text-xs font-medium text-slate-300">{p.fileName ?? "Select 16:9 MP4 / MOV Video File"}</span>
            <span className="text-[11px] text-slate-500">Auto-Reframing to 9:16 Vertical Supported</span>
            <input type="file" accept="video/*" className="hidden" onChange={(e) => p.onFileChange(e.target.files?.[0] ?? null)} />
          </label>
          <button type="button" onClick={p.onProcess} className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:bg-purple-500">
            Process Local Video File
          </button>
        </div>
      )}
      {p.error && <p className="text-xs text-red-400">{p.error}</p>}
    </div>
  );
}
