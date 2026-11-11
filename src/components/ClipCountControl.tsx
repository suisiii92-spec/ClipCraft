const COUNTS = [3, 5, 8, 12];

type Props = { count: number; onChange: (n: number) => void };

export default function ClipCountControl({ count, onChange }: Props) {
  return (
    <div className="space-y-2 border-t border-slate-800/60 pt-3">
      <span className="text-xs font-medium text-slate-300">Number of Clips</span>
      <div className="grid grid-cols-4 gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
        {COUNTS.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={count === n}
            onClick={() => onChange(n)}
            className={`rounded-md py-1.5 text-[11px] font-bold transition ${
              count === n ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:bg-slate-800"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
