type Props = {
  duration: number;
  auto: boolean;
  onDurationChange: (s: number) => void;
  onAutoSelect: () => void;
};

export default function DurationControl({ duration, auto, onDurationChange, onAutoSelect }: Props) {
  return (
    <div className="space-y-2 border-t border-slate-800/60 pt-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-300">Target Clip Duration</span>
        <button
          type="button"
          aria-pressed={auto}
          onClick={onAutoSelect}
          className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
            auto ? "border-purple-500 bg-purple-600 text-white" : "border-purple-700 bg-purple-950 text-purple-300 hover:bg-purple-900"
          }`}
        >
          ✨ Auto Select Best Duration
        </button>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range" min={15} max={60} step={5} value={duration}
          onChange={(e) => onDurationChange(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-950 accent-purple-500"
        />
        <span className="min-w-[50px] text-right text-xs font-bold text-purple-400">{auto ? "Auto" : `${duration}s`}</span>
      </div>
    </div>
  );
}
