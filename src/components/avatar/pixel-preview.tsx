"use client";

import { type CSSProperties, type HTMLAttributes } from "react";
import { HEAD_CANVAS, BODY_CANVAS, type PixelLayer, type PixelSprite } from "@/lib/pixel-avatar";

const PREVIEW_SIZE_MAP = {
  xs: 40,
  sm: 56,
  md: 72,
  lg: 96,
} as const;

interface LayerPreviewProps {
  layer: PixelLayer;
  columns: number;
}

function LayerPreview({ layer, columns }: LayerPreviewProps) {
  return (
    <div className="grid w-full gap-[1px]" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
      {layer.map((color, index) => (
        <span
          key={index}
          className="aspect-square rounded-[2px] pixel-cell"
          data-filled={color ? "1" : "0"}
          style={{ backgroundColor: color ?? "transparent", position: "relative" }}
        />
      ))}
    </div>
  );
}

export type SpritePreviewSize = keyof typeof PREVIEW_SIZE_MAP;

interface PixelPreviewProps extends HTMLAttributes<HTMLDivElement> {
  sprite: PixelSprite;
  size?: SpritePreviewSize;
  framed?: boolean;
}

export function PixelPreview({ sprite, size = "md", className, style, framed = true, ...props }: PixelPreviewProps) {
  const width = PREVIEW_SIZE_MAP[size] ?? PREVIEW_SIZE_MAP.md;
  const mergedStyle: CSSProperties = { width, ...(style ?? {}) };
  const baseClass = framed
    ? "flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-slate-950/80 p-2"
    : "flex flex-col items-center gap-1";
  return (
    <div
      className={`${baseClass} ${className ?? ""}`.trim()}
      style={mergedStyle}
      {...props}
    >
      <LayerPreview layer={sprite.head} columns={HEAD_CANVAS.cols} />
      <LayerPreview layer={sprite.body} columns={BODY_CANVAS.cols} />
    </div>
  );
}
