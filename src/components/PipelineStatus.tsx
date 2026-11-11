export type ProcessingStage = "idle" | "extracting" | "scoring" | "done";
type StepStatus = "idle" | "running" | "done";

const BADGE: Record<StepStatus, { text: string; className: string }> = {
  idle: { text: "IDLE", className: "bg-slate-800 text-slate-400" },
  running: { text: "RUNNING...", className: "bg-amber-500/20 text-amber-300" },
  done: { text: "DONE ✓", className: "bg-emerald-500/20 text-emerald-300" },
};

const STEPS: { label: string; statusFor: (s: ProcessingStage) => StepStatus }[] = [
  { label: "1. Audio Extraction & Speech Sync", statusFor: (s) => (s === "extracting" ? "running" : s === "idle" ? "idle" : "done") },
  { label: "2. Virality Scoring & Best Moments Cut", statusFor: (s) => (s === "scoring" ? "running" : s === "done" ? "done" : "idle") },
];

export default function PipelineStatus({ stage }: { stage: ProcessingStage }) {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-4 shadow-xl">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Multi-Thread Processing</h2>
        <span className="text-[11px] font-medium text-purple-400">GPU Accelerated</span>
      </div>
      <div className="space-y-1.5">
        {STEPS.map((step) => {
          const b = BADGE[step.statusFor(stage)];
          return (
            <div key={step.label} className="flex items-center justify-between rounded-xl border border-slate-800/50 bg-slate-950/60 p-2">
              <span className="text-xs text-slate-300">{step.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${b.className}`}>{b.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
