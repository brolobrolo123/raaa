"use client";

import { useEffect, useState } from "react";
import { Paintbrush, Eraser, PaintBucket, Pipette, Trash2, RotateCcw } from "lucide-react";
import { SpriteLayerCanvas } from "@/components/profile/fab-sprite-designer";
import { PixelPreview } from "@/components/avatar/pixel-preview";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";
import {
  BODY_CANVAS,
  HEAD_CANVAS,
  PIXEL_DEFAULT_PALETTE,
  cloneSprite,
  createEmptySprite,
  type PixelSprite,
} from "@/lib/pixel-avatar";

type Tool = "paint" | "erase" | "fill" | "eyedropper";

interface RegisterAvatarModalProps {
  open: boolean;
  initialSprite: PixelSprite;
  loading?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (sprite: PixelSprite) => void;
}

export function RegisterAvatarModal({
  open,
  initialSprite,
  loading = false,
  error,
  onCancel,
  onConfirm,
}: RegisterAvatarModalProps) {
  const t = useTranslations();
  const [sprite, setSprite] = useState<PixelSprite>(() => cloneSprite(initialSprite));
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState<string>(PIXEL_DEFAULT_PALETTE[0]);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [tool, setTool] = useState<Tool>("paint");
  const [activeLayer, setActiveLayer] = useState<"head" | "body">("head");

  useEffect(() => {
    if (open) {
      setSprite(cloneSprite(initialSprite));
    }
  }, [open, initialSprite]);

  useEffect(() => {
    if (open) {
      setSelectedColor(null);
      setCustomColor(PIXEL_DEFAULT_PALETTE[0]);
      setRecentColors([]);
      setTool("paint");
      setActiveLayer("head");
    }
  }, [open]);

  const recordRecentColor = (color: string) => {
    setRecentColors((prev) => {
      const sanitized = [color, ...prev.filter((entry) => entry !== color)];
      return sanitized.slice(0, 4);
    });
  };

  const handleRecentColorSelect = (color: string) => {
    setSelectedColor(color);
    setCustomColor(color);
    recordRecentColor(color);
    setTool("paint");
  };

  const handleCustomColorPick = (value: string) => {
    setCustomColor(value);
    setSelectedColor(value);
    setTool("paint");
  };

  const applyPaint = (layer: keyof PixelSprite, index: number, color: string | null) => {
    let mutated = false;
    setSprite((prev) => {
      if ((prev[layer][index] ?? null) === color) {
        return prev;
      }
      mutated = true;
      const next = cloneSprite(prev);
      next[layer][index] = color;
      return next;
    });
    if (mutated && color) {
      recordRecentColor(color);
    }
  };

  const handleClear = () => {
    setSprite(createEmptySprite());
  };

  const handleReset = () => {
    setSprite(cloneSprite(initialSprite));
    setSelectedColor(null);
    setCustomColor(PIXEL_DEFAULT_PALETTE[0]);
    setRecentColors([]);
    setTool("paint");
    setActiveLayer("head");
  };

  const getLayerColumns = (layer: keyof PixelSprite) => (layer === "head" ? HEAD_CANVAS.cols : BODY_CANVAS.cols);

  const fillRegion = (layer: keyof PixelSprite, index: number) => {
    const fillColor = selectedColor ?? null;
    if (fillColor === null) {
      return;
    }
    let mutated = false;
    setSprite((prev) => {
      const targetColor = prev[layer][index] ?? null;
      if (targetColor === fillColor) {
        return prev;
      }
      const next = cloneSprite(prev);
      const nextLayer = next[layer];
      const baseLayer = prev[layer];
      const columns = getLayerColumns(layer);
      const stack: number[] = [index];
      const visited = new Set<number>();
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;
        visited.add(current);
        if ((baseLayer[current] ?? null) !== targetColor) continue;
        mutated = true;
        nextLayer[current] = fillColor;
        const row = Math.floor(current / columns);
        const col = current % columns;
        if (col > 0) stack.push(current - 1);
        if (col < columns - 1) stack.push(current + 1);
        if (row > 0) stack.push(current - columns);
        if ((row + 1) * columns < nextLayer.length) stack.push(current + columns);
      }
      return mutated ? next : prev;
    });
    if (mutated && fillColor) {
      recordRecentColor(fillColor);
    }
  };

  const handleCanvasClick = (layer: keyof PixelSprite, index: number) => {
    if (tool === "eyedropper") {
      const color = sprite[layer][index] ?? null;
      setSelectedColor(color);
      if (color) {
        setCustomColor(color);
        recordRecentColor(color);
      }
      setTool("paint");
      return;
    }
    if (tool === "fill") {
      if (selectedColor === null) {
        return;
      }
      fillRegion(layer, index);
      return;
    }
    if (tool === "erase") {
      applyPaint(layer, index, null);
      return;
    }
    if (selectedColor === null) {
      return;
    }
    applyPaint(layer, index, selectedColor);
  };

  if (!open) {
    return null;
  }

  const headFilled = sprite.head.some(Boolean);
  const bodyFilled = sprite.body.some(Boolean);
  const canSubmit = headFilled && bodyFilled;
  const confirmDisabled = loading || !canSubmit;

  const handleConfirm = () => {
    if (confirmDisabled) {
      return;
    }
    onConfirm(sprite);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div
        className="absolute inset-0 bg-[#020207]/90 backdrop-blur-[40px]"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-5xl max-h-[92vh] space-y-6 overflow-y-auto rounded-[44px] border border-[#4b2d16] bg-gradient-to-br from-[#150903]/95 via-[#3b1c0f]/92 to-[#070302]/95 p-6 text-white shadow-[0_35px_120px_rgba(0,0,0,0.95)]">
        <div className="flex flex-wrap items-baseline gap-3 text-balance">
          <h2 className="text-3xl font-semibold leading-tight">{t("auth.registerForm.avatarModal.title")}</h2>
          <p className="text-sm text-white/70">{t("auth.registerForm.avatarModal.subtitle")}</p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full max-w-sm space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                {t("auth.registerForm.avatarModal.recentLabel")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, index) => {
                  const color = recentColors[index];
                  const isActive = color && selectedColor === color;
                  return color ? (
                    <button
                      key={`recent-${color}`}
                      type="button"
                      onClick={() => handleRecentColorSelect(color)}
                      className={cn(
                        "h-10 w-10 rounded-2xl border-2",
                        isActive ? "border-white" : "border-transparent",
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`${t("auth.registerForm.avatarModal.pickColor").replace("{color}", color)}`}
                    />
                  ) : (
                    <span
                      key={`placeholder-${index}`}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-dashed border-white/20 text-[0.6rem] uppercase tracking-[0.3em] text-white/30"
                    >
                      --
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm text-slate-200">
                <span>{t("auth.registerForm.avatarModal.customLabel")}</span>
                <input
                  type="color"
                  value={customColor}
                  onChange={(event) => handleCustomColorPick(event.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-lg border border-white/20 bg-transparent"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-label={t("auth.registerForm.avatarModal.paint")}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl border transition",
                    tool === "paint"
                      ? "border-white bg-white/15 text-white"
                      : "border-white/25 text-white/70 hover:border-white/40 hover:text-white",
                  )}
                  onClick={() => setTool("paint")}
                >
                  <Paintbrush className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={t("auth.registerForm.avatarModal.erase")}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl border transition",
                    tool === "erase"
                      ? "border-white bg-white/15 text-white"
                      : "border-white/25 text-white/70 hover:border-white/40 hover:text-white",
                  )}
                  onClick={() => setTool("erase")}
                >
                  <Eraser className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={t("auth.registerForm.avatarModal.fill")}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl border transition",
                    tool === "fill"
                      ? "border-white bg-white/15 text-white"
                      : "border-white/25 text-white/70 hover:border-white/40 hover:text-white",
                    selectedColor === null && "cursor-not-allowed opacity-40",
                  )}
                  onClick={() => {
                    if (selectedColor === null) return;
                    setTool("fill");
                  }}
                >
                  <PaintBucket className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={t("auth.registerForm.avatarModal.eyedropper")}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl border transition",
                    tool === "eyedropper"
                      ? "border-white bg-white/15 text-white"
                      : "border-white/25 text-white/70 hover:border-white/40 hover:text-white",
                  )}
                  onClick={() => setTool("eyedropper")}
                >
                  <Pipette className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={t("auth.registerForm.avatarModal.reset")}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl border transition",
                    "border-white/25 text-white/70 hover:border-white/40 hover:text-white",
                  )}
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={t("auth.registerForm.avatarModal.clear")}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/25 text-white/70 transition hover:border-white/40 hover:text-white"
                  onClick={handleClear}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex gap-3">
              {(["head", "body"] as const).map((layerKey) => (
                <button
                  key={layerKey}
                  type="button"
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em]",
                    activeLayer === layerKey
                      ? "border-white bg-white/10 text-white"
                      : "border-white/20 text-white/60 hover:border-white/40 hover:text-white",
                  )}
                  onClick={() => setActiveLayer(layerKey)}
                >
                  {layerKey === "head"
                    ? t("auth.registerForm.avatarModal.headLabel")
                    : t("auth.registerForm.avatarModal.bodyLabel")}
                </button>
              ))}
            </div>
            <SpriteLayerCanvas
              label={
                activeLayer === "head"
                  ? t("auth.registerForm.avatarModal.headLabel")
                  : t("auth.registerForm.avatarModal.bodyLabel")
              }
              layer={activeLayer === "head" ? sprite.head : sprite.body}
              columns={activeLayer === "head" ? HEAD_CANVAS.cols : BODY_CANVAS.cols}
              onPaint={(index) => handleCanvasClick(activeLayer, index)}
              highlight={activeLayer === "head" ? !headFilled : !bodyFilled}
              highlightMessage={t("auth.registerForm.avatarModal.fillHint")}
            />
          </div>

          <div className="w-full max-w-sm space-y-5">
            <div className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                {t("auth.registerForm.avatarModal.previewLabel")}
              </p>
              <PixelPreview sprite={sprite} size="lg" className="mx-auto" />
              <p className="text-sm text-slate-200/80">
                {t("auth.registerForm.avatarModal.fillHint")}
              </p>
            </div>
            {error ? (
              <p className="rounded-2xl border border-rose-400/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 min-w-[140px]"
                onClick={onCancel}
                disabled={loading}
              >
                {t("auth.registerForm.avatarModal.cancel")}
              </Button>
              <Button
                type="button"
                className="flex-1 min-w-[140px]"
                onClick={handleConfirm}
                disabled={confirmDisabled}
                aria-busy={loading}
              >
                {t("auth.registerForm.avatarModal.confirm")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
