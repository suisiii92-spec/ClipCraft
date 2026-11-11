import { useEffect, useState } from "react";
import { Scissors } from "lucide-react";
import ClipCard from "@/components/ClipCard";
import ClipCountControl from "@/components/ClipCountControl";
import DurationControl from "@/components/DurationControl";
import PipelineStatus, { type ProcessingStage } from "@/components/PipelineStatus";
import QualityControl from "@/components/QualityControl";
import SourceSelector from "@/components/SourceSelector";
import { analyze, getPlan, type Quality } from "@/lib/api";
import { getYouTubeId, type ClipPlan, type ClipSource, type SourceMode } from "@/lib/clips";
import { DEFAULT_CLIP_STYLE, type ClipStyle } from "@/lib/clipStyle";

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

function App() {
  const [mode, setMode] = useState<SourceMode>("youtube");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(30);
  const [auto, setAuto] = useState(true);
  const [quality, setQuality] = useState<Quality>("1080");
  const [count, setCount] = useState(3);
  const [fit, setFit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ClipSource | null>(null);
  const [clips, setClips] = useState<ClipPlan[]>([]);
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [clipStyles, setClipStyles] = useState<Record<number, ClipStyle>>({});

  const updateClipStyle = (index: number, patch: Partial<ClipStyle>) =>
    setClipStyles((prev) => ({ ...prev, [index]: { ...(prev[index] ?? DEFAULT_CLIP_STYLE), ...patch } }));

  // Re-plan best moments when the duration setting changes (no re-upload needed).
  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const plan = await getPlan(source.id, auto ? 0 : duration, count);
        if (!cancelled) setClips(plan);
      } catch (e) {
        if (!cancelled) setError(errMsg(e));
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source, duration, auto, count]);

  const reset = () => {
    setSource(null);
    setClips([]);
    setStage("idle");
  };

  const handleProcess = async () => {
    if (stage === "extracting") return;
    let input: { url: string } | { file: File };
    if (mode === "youtube") {
      const url = youtubeInput.trim();
      if (!getYouTubeId(url)) {
        setError("Paste a valid YouTube link to continue.");
        return;
      }
      input = { url };
    } else {
      if (!file) {
        setError("Choose a video file to continue.");
        return;
      }
      input = { file };
    }
    setError(null);
    reset();
    setStage("extracting");
    try {
      const res = await analyze(input, auto ? 0 : duration, count);
      setClips(res.clips);
      setSource({ id: res.id, kind: mode, width: res.width, height: res.height });
      setStage("done");
    } catch (e) {
      setStage("idle");
      setError(errMsg(e));
    }
  };

  const badge = source
    ? `${clips.length} Clips Ready`
    : stage === "extracting"
      ? "Analyzing..."
      : "Waiting for video";

  return (
    <div className="mx-auto min-h-screen max-w-md space-y-6 px-4 pb-12 pt-6">
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-purple-400 text-white shadow-lg shadow-purple-500/20">
            <Scissors size={20} />
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-extrabold text-slate-100">
              ClipCraft Studio
              <span className="rounded-full border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-purple-300">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400">Automated Short Video Extraction & Dynamic Captions</p>
          </div>
        </div>
      </header>

      <section className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-4 shadow-xl">
        <SourceSelector
          mode={mode}
          onModeChange={(m) => {
            setMode(m);
            setError(null);
            reset();
          }}
          youtubeInput={youtubeInput}
          onYoutubeInputChange={setYoutubeInput}
          fileName={file?.name ?? null}
          onFileChange={(f) => {
            setFile(f);
            setError(null);
            reset();
          }}
          error={error}
          onProcess={handleProcess}
        />
        <DurationControl
          duration={duration}
          auto={auto}
          onDurationChange={(d) => {
            setDuration(d);
            setAuto(false);
          }}
          onAutoSelect={() => setAuto(true)}
        />
        <ClipCountControl count={count} onChange={setCount} />
        <QualityControl
          quality={quality}
          onChange={setQuality}
          fit={fit}
          onFitChange={setFit}
          sourceSize={source ? { width: source.width, height: source.height } : null}
        />
      </section>

      <PipelineStatus stage={stage} />

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Extracted Viral Short Clips</h2>
          <span className="rounded border border-emerald-800 bg-emerald-950 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
            {badge}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {source && clips.length > 0 ? (
            clips.map((clip) => (
              <ClipCard
                key={`${source.id}-${clip.index}-${clip.start}-${clip.end}`}
                clip={clip}
                source={source}
                quality={quality}
                fit={fit}
                style={clipStyles[clip.index] ?? DEFAULT_CLIP_STYLE}
                onStyleChange={(patch) => updateClipStyle(clip.index, patch)}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center text-xs text-slate-400">
              Process a video to see the best viral moments
            </div>
          )}
        </div>
        {source && clips.length > 0 && clips.length < count && (
          <p className="px-1 text-[11px] text-amber-400">
            Only {clips.length} strong moments found. Try fewer clips or a shorter duration.
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
