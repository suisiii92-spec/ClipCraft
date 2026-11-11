export const ASPECT_RATIOS = ["9:16", "1:1", "4:5", "16:9"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];
export const CAPTION_SIZES = ["sm", "md", "lg"] as const;
export type CaptionSize = (typeof CAPTION_SIZES)[number];
export const CAPTION_COLORS = ["yellow", "white", "cyan"] as const;
export type CaptionColor = (typeof CAPTION_COLORS)[number];
export const CAPTION_POSITIONS = ["top", "middle", "bottom"] as const;
export type CaptionPosition = (typeof CAPTION_POSITIONS)[number];

export type ClipStyle = {
  aspectRatio: AspectRatio;
  captionText: string;
  captionSize: CaptionSize;
  captionColor: CaptionColor;
  captionPosition: CaptionPosition;
  captionBackground: boolean;
};

export const DEFAULT_CLIP_STYLE: ClipStyle = {
  aspectRatio: "9:16", captionText: "", captionSize: "md",
  captionColor: "yellow", captionPosition: "bottom", captionBackground: true,
};

export function toCssAspectRatio(a: AspectRatio): string {
  return a.replace(":", "/");
}
