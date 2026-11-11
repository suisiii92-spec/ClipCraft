import { type CaptionColor, type CaptionPosition, type CaptionSize } from "@/lib/clipStyle";

type Props = { text: string; size: CaptionSize; color: CaptionColor; position: CaptionPosition; background: boolean };

const SIZE: Record<CaptionSize, string> = { sm: "text-sm", md: "text-base", lg: "text-xl" };
const COLOR: Record<CaptionColor, string> = { yellow: "text-yellow-300", white: "text-white", cyan: "text-cyan-300" };
const POS: Record<CaptionPosition, string> = { top: "top-4", middle: "top-1/2 -translate-y-1/2", bottom: "bottom-12" };

export function ClipCaption({ text, size, color, position, background }: Props) {
  if (!text.trim()) return null;
  const surface = background ? "bg-black/80 backdrop-blur-sm" : "[text-shadow:0_2px_8px_rgba(0,0,0,0.9)]";
  return (
    <div className={`pointer-events-none absolute inset-x-3 flex justify-center ${POS[position]}`}>
      <p className={`max-w-full rounded-lg px-2.5 py-1.5 text-center font-extrabold uppercase leading-tight break-words ${SIZE[size]} ${COLOR[color]} ${surface}`}>
        {text}
      </p>
    </div>
  );
}
