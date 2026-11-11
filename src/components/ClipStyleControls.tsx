import {
  ASPECT_RATIOS,
  CAPTION_COLORS,
  CAPTION_POSITIONS,
  CAPTION_SIZES,
  type ClipStyle,
} from "@/lib/clipStyle";

type ClipStyleControlsProps = {
  style: ClipStyle;
  onChange: (patch: Partial<ClipStyle>) => void;
};

type Option<T extends string> = { value: T; label: string };

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-md py-1.5 text-xs font-semibold transition ${
              value === option.value
                ? "bg-purple-600 text-white shadow"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const SWATCH_CLASSES: Record<(typeof CAPTION_COLORS)[number], string> = {
  yellow: "bg-yellow-300",
  white: "bg-white",
  cyan: "bg-cyan-300",
};

export default function ClipStyleControls({ style, onChange }: ClipStyleControlsProps) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <SegmentedControl
        label="Frame shape"
        options={ASPECT_RATIOS.map((ratio) => ({ value: ratio, label: ratio }))}
        value={style.aspectRatio}
        onChange={(aspectRatio) => onChange({ aspectRatio })}
      />

      <div className="space-y-1.5">
        <label htmlFor="caption-text" className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Caption text
        </label>
        <input
          id="caption-text"
          type="text"
          maxLength={80}
          value={style.captionText}
          onChange={(e) => onChange({ captionText: e.target.value })}
          placeholder="Add a caption (optional)"
          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
        />
      </div>

      <SegmentedControl
        label="Caption size"
        options={CAPTION_SIZES.map((size) => ({ value: size, label: size.toUpperCase() }))}
        value={style.captionSize}
        onChange={(captionSize) => onChange({ captionSize })}
      />

      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Caption color</span>
        <div className="flex gap-2">
          {CAPTION_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`${color} caption color`}
              aria-pressed={style.captionColor === color}
              onClick={() => onChange({ captionColor: color })}
              className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-slate-950 transition ${SWATCH_CLASSES[color]} ${
                style.captionColor === color ? "ring-2 ring-purple-400" : "ring-0 hover:scale-110"
              }`}
            />
          ))}
        </div>
      </div>

      <SegmentedControl
        label="Caption position"
        options={CAPTION_POSITIONS.map((position) => ({
          value: position,
          label: position.charAt(0).toUpperCase() + position.slice(1),
        }))}
        value={style.captionPosition}
        onChange={(captionPosition) => onChange({ captionPosition })}
      />

      <button
        type="button"
        aria-pressed={style.captionBackground}
        onClick={() => onChange({ captionBackground: !style.captionBackground })}
        className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200"
      >
        Caption background
        <span
          className={`relative h-5 w-9 rounded-full transition-colors ${style.captionBackground ? "bg-purple-600" : "bg-slate-700"}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${style.captionBackground ? "left-[18px]" : "left-0.5"}`}
          />
        </span>
      </button>
    </div>
  );
}
