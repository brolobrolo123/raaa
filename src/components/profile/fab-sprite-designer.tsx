"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Paintbrush, Eraser, PaintBucket, Pipette, Trash2, RotateCcw } from "lucide-react";
import { PixelPreview } from "@/components/avatar/pixel-preview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/lib/i18n/client";
import {
  FabSpriteCollection,
  parseFabSpriteCollection,
  PIXEL_DEFAULT_PALETTE,
  HEAD_CANVAS,
  BODY_CANVAS,
  cloneSprite,
  createEmptySprite,
  type PixelSprite,
  type PixelLayer,
  MAX_SPRITE_SLOTS,
} from "@/lib/pixel-avatar";

interface FabSpriteDesignerProps {
  initialSprite?: string | null;
  availablePoints: number;
}

type Status = "idle" | "saving" | "saved";
type Tool = "paint" | "erase" | "fill" | "eyedropper";
type SpriteResponse = { sprite: string | null } | null;

export function FabSpriteDesigner({ initialSprite, availablePoints }: FabSpriteDesignerProps) {
  const t = useTranslations();
  const collection = parseFabSpriteCollection(initialSprite);
  const [designs, setDesigns] = useState<PixelSprite[]>(() => collection.designs.map((design) => cloneSprite(design)));
  const [selectedSlot, setSelectedSlot] = useState(collection.activeSlot);
  const [activeSlot, setActiveSlot] = useState(collection.activeSlot);
  const [sprite, setSprite] = useState<PixelSprite>(() => cloneSprite(collection.designs[collection.activeSlot]));
  const [baseline, setBaseline] = useState<PixelSprite>(() => cloneSprite(collection.designs[collection.activeSlot]));
  const [selectedColor, setSelectedColor] = useState<string | null>(PIXEL_DEFAULT_PALETTE[0]);
  const [customColor, setCustomColor] = useState<string>(PIXEL_DEFAULT_PALETTE[0]);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [availablePointsState, setAvailablePointsState] = useState(availablePoints);
  const [slotsUnlocked, setSlotsUnlocked] = useState<number>(collection.unlockedSlots);
  const unlockedSlots = useMemo(
    () => Array.from({ length: MAX_SPRITE_SLOTS }, (_, index) => index < slotsUnlocked),
    [slotsUnlocked],
  );
  const [tool, setTool] = useState<Tool>("paint");
  const [activeLayer, setActiveLayer] = useState<"head" | "body">("head");
  const [unlockingSlot, setUnlockingSlot] = useState<number | null>(null);

  useEffect(() => {
    const nextCollection = parseFabSpriteCollection(initialSprite);
    setDesigns(nextCollection.designs.map((design) => cloneSprite(design)));
    setActiveSlot(nextCollection.activeSlot);
    setSelectedSlot(nextCollection.activeSlot);
    setSprite(cloneSprite(nextCollection.designs[nextCollection.activeSlot]));
    setBaseline(cloneSprite(nextCollection.designs[nextCollection.activeSlot]));
    setActiveLayer("head");
    setSlotsUnlocked(nextCollection.unlockedSlots);
  }, [initialSprite]);

  useEffect(() => {
    setAvailablePointsState(availablePoints);
  }, [availablePoints]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setTool("paint");
    setActiveLayer("head");
    setRecentColors([]);
  }, [isOpen]);

  const hasChanges = useMemo(
    () =>
      sprite.head.some((color, index) => color !== baseline.head[index]) ||
      sprite.body.some((color, index) => color !== baseline.body[index]),
    [sprite, baseline],
  );
  const costPerDesign = 100;
  const headFilled = useMemo(() => sprite.head.some(Boolean), [sprite.head]);
  const bodyFilled = useMemo(() => sprite.body.some(Boolean), [sprite.body]);

  const recordRecentColor = (color: string) => {
    setRecentColors((previous) => {
      const sanitized = [color, ...previous.filter((entry) => entry !== color)];
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

  const applyColor = (layer: keyof PixelSprite, index: number, color: string | null) => {
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

  const readJsonSafely = async (response: Response) => {
    try {
      return await response.json();
    } catch {
      return null;
    }
  };

  const extractErrorMessage = (payload: unknown, fallback: string) => {
    if (payload && typeof payload === "object" && "error" in payload) {
      const possible = (payload as { error?: unknown }).error;
      if (typeof possible === "string" && possible.trim().length > 0) {
        return possible;
      }
    }
    return fallback;
  };

  const getLayerColumns = (layer: keyof PixelSprite) => (layer === "head" ? HEAD_CANVAS.cols : BODY_CANVAS.cols);

  const getNeighbors = (index: number, columns: number, total: number) => {
    const neighbors: number[] = [];
    const row = Math.floor(index / columns);
    const col = index % columns;
    if (col > 0) neighbors.push(index - 1);
    if (col < columns - 1) neighbors.push(index + 1);
    if (row > 0) neighbors.push(index - columns);
    if ((row + 1) * columns < total) neighbors.push(index + columns);
    return neighbors;
  };

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
        const neighbors = getNeighbors(current, columns, nextLayer.length);
        neighbors.forEach((neighbor) => {
          if (!visited.has(neighbor) && (baseLayer[neighbor] ?? null) === targetColor) {
            stack.push(neighbor);
          }
        });
      }
      return mutated ? next : prev;
    });
    if (mutated) {
      recordRecentColor(fillColor);
    }
  };

  const pickColor = (layer: keyof PixelSprite, index: number) => {
    const color = sprite[layer][index] ?? null;
    setSelectedColor(color);
    if (color) {
      setCustomColor(color);
      recordRecentColor(color);
    }
    setTool("paint");
  };

  const handleCanvasClick = (layer: keyof PixelSprite, index: number) => {
    if (tool === "eyedropper") {
      pickColor(layer, index);
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
      applyColor(layer, index, null);
      return;
    }
    if (selectedColor === null) {
      return;
    }
    applyColor(layer, index, selectedColor);
  };

  const handleClearAll = () => {
    setSprite((prev) => {
      const hasPixels = prev.head.some(Boolean) || prev.body.some(Boolean);
      if (!hasPixels) {
        return prev;
      }
      return createEmptySprite();
    });
  };

  const handleRestoreBaseline = () => {
    setSprite(cloneSprite(baseline));
  };

  const selectSlot = (index: number) => {
    if (!unlockedSlots[index]) return;
    setSelectedSlot(index);
    setSprite(cloneSprite(designs[index]));
    setBaseline(cloneSprite(designs[index]));
    setIsOpen(true);
  };

  const handleUnlockSlot = async (index: number) => {
    if (unlockedSlots[index]) return;
    if (slotsUnlocked >= MAX_SPRITE_SLOTS) {
      setError(t("avatarPage.designer.errors.maxSlots"));
      return;
    }
    const nextSlotIndex = slotsUnlocked;
    if (index !== nextSlotIndex) {
      setError(t("avatarPage.designer.errors.sequence"));
      return;
    }
    if (availablePointsState < costPerDesign) {
      setError(t("avatarPage.designer.errors.insufficientPoints"));
      return;
    }
    setUnlockingSlot(index);
    try {
      const response = await fetch("/api/avatar/designer/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: index }),
      });
      const payload = await readJsonSafely(response);
      if (!response.ok) {
        throw new Error(extractErrorMessage(payload, t("avatarPage.designer.errors.generic")));
      }
      let updatedDesignSource = designs[index];
      if (payload?.sprite) {
        const parsed = parseFabSpriteCollection(payload.sprite);
        setDesigns(parsed.designs.map((design) => cloneSprite(design)));
        setActiveSlot(parsed.activeSlot);
        setSlotsUnlocked(parsed.unlockedSlots);
        updatedDesignSource = parsed.designs[index] ?? parsed.designs[parsed.activeSlot];
      } else if (typeof payload?.unlockedSlots === "number") {
        setSlotsUnlocked(payload.unlockedSlots);
      } else {
        setSlotsUnlocked((prev) => Math.min(MAX_SPRITE_SLOTS, prev + 1));
      }
      if (typeof payload?.availablePoints === "number") {
        setAvailablePointsState(payload.availablePoints);
      } else {
        setAvailablePointsState((prev) => Math.max(0, prev - costPerDesign));
      }
      const nextSprite = updatedDesignSource ? cloneSprite(updatedDesignSource) : cloneSprite(sprite);
      setSelectedSlot(index);
      setSprite(nextSprite);
      setBaseline(cloneSprite(nextSprite));
      setIsOpen(true);
      setError(null);
    } catch (caught) {
      console.error(caught);
      setError(caught instanceof Error ? caught.message : t("avatarPage.designer.errors.generic"));
    } finally {
      setUnlockingSlot(null);
    }
  };

  const handleSave = async () => {
    if (!headFilled || !bodyFilled) {
      setError(t("avatarPage.designer.errors.incompleteLayers"));
      return;
    }
    if (!hasChanges) return;
    setStatus("saving");
    setError(null);
    const updatedDesigns = designs.map((design, index) => (index === selectedSlot ? cloneSprite(sprite) : design));
    const payloadCollection: FabSpriteCollection = {
      activeSlot,
      designs: updatedDesigns,
      unlockedSlots: slotsUnlocked,
    };
    try {
      const response = await fetch("/api/profile/fab-sprite", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: payloadCollection }),
      });
      const payload = (await readJsonSafely(response)) as SpriteResponse;
      if (!response.ok) {
        throw new Error(extractErrorMessage(payload, t("avatarPage.designer.errors.saveFailed")));
      }
      const parsedCollection = parseFabSpriteCollection(payload?.sprite ?? undefined);
      const savedSprite = cloneSprite(parsedCollection.designs[selectedSlot]);
      setDesigns(parsedCollection.designs.map((design) => cloneSprite(design)));
      setActiveSlot(parsedCollection.activeSlot);
      setSprite(cloneSprite(savedSprite));
      setBaseline(cloneSprite(savedSprite));
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 2000);
      window.setTimeout(() => window.location.reload(), 500);
    } catch (caught) {
      console.error(caught);
      setError(caught instanceof Error ? caught.message : t("avatarPage.designer.errors.generic"));
      setStatus("idle");
    }
  };

  const handleUseDesign = async (index: number) => {
    if (activeSlot === index) return;
    setStatus("saving");
    setError(null);
    const collectionToUse: FabSpriteCollection = {
      activeSlot: index,
      designs: designs.map((design) => cloneSprite(design)),
      unlockedSlots: slotsUnlocked,
    };
    try {
      const response = await fetch("/api/profile/fab-sprite", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: collectionToUse }),
      });
      const payload = (await readJsonSafely(response)) as SpriteResponse;
      if (!response.ok) {
        throw new Error(extractErrorMessage(payload, t("avatarPage.designer.errors.hudFailed")));
      }
      const parsedCollection = parseFabSpriteCollection(payload?.sprite ?? undefined);
      setDesigns(parsedCollection.designs.map((design) => cloneSprite(design)));
      setActiveSlot(parsedCollection.activeSlot);
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 2000);
      window.setTimeout(() => window.location.reload(), 500);
    } catch (caught) {
      console.error(caught);
      setError(caught instanceof Error ? caught.message : t("avatarPage.designer.errors.generic"));
      setStatus("idle");
    }
  };

  const handleCloseEditor = () => {
    setSprite(cloneSprite(baseline));
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  return (
    <Card className="border-white/10 bg-white/10">
      <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
        {error && <span className="text-rose-300">{error}</span>}
        {status === "saved" && <span className="text-emerald-300">{t("avatarPage.designer.statusSaved")}</span>}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[10px] uppercase tracking-[0.35em] text-white/70">
        <span>
          {t("avatarPage.designer.unlockedLabel")}: {slotsUnlocked}/{MAX_SPRITE_SLOTS}
        </span>
        <span>
          {t("avatarPage.designer.availablePoints")}: {availablePointsState}
        </span>
        <span className="text-emerald-200">
          {t("avatarPage.designer.unlockCost").replace("{cost}", String(costPerDesign))}
        </span>
      </div>

      <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {unlockedSlots.map((unlocked, index) => (
            <div
              key={`slot-${index}`}
              className={cn(
                "flex flex-col gap-2 rounded-2xl border p-3 text-xs",
                unlocked ? "border-white/40 bg-white/5" : "border-white/15 bg-slate-950/40",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">
                  {t("avatarPage.designer.slotLabel").replace("{number}", String(index + 1))}
                </p>
                {activeSlot === index && <span className="text-[10px] text-cyan-300">{t("avatarPage.designer.active")}</span>}
              </div>
              <div className="mt-1 flex items-center justify-center">
                <PixelPreview sprite={designs[index]} />
              </div>
              {unlocked ? (
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "text-[10px] text-slate-200",
                      selectedSlot === index ? "text-white" : "text-slate-200",
                    )}
                    onClick={() => selectSlot(index)}
                  >
                    {selectedSlot === index ? t("avatarPage.designer.editing") : t("avatarPage.designer.edit")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-[10px] text-slate-200"
                    disabled={activeSlot === index || status === "saving"}
                    onClick={() => handleUseDesign(index)}
                  >
                    {activeSlot === index ? t("avatarPage.designer.used") : t("avatarPage.designer.use")}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-[10px] text-slate-200"
                  disabled={availablePointsState < costPerDesign || unlockingSlot !== null}
                  aria-busy={unlockingSlot === index}
                  onClick={() => handleUnlockSlot(index)}
                >
                  {unlockingSlot === index
                    ? t("avatarPage.designer.unlocking")
                    : `${t("avatarPage.designer.unlock")} ${costPerDesign} ${t("avatarPage.designer.unlockCostSuffix")}`}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {isOpen && (
        <SpriteEditorModal
          onClose={handleCloseEditor}
          modeLabel={t("avatarPage.designer.modal.modeLabel")}
          title={t("avatarPage.designer.modal.boardTitle")}
          closeLabel={t("avatarPage.designer.modal.close")}
        >
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
                        aria-label={t("auth.registerForm.avatarModal.pickColor").replace("{color}", color)}
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
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/25 text-white/70 transition hover:border-white/40 hover:text-white"
                    onClick={handleRestoreBaseline}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={t("auth.registerForm.avatarModal.clear")}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/25 text-white/70 transition hover:border-white/40 hover:text-white"
                    onClick={handleClearAll}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
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
            </div>

            <div className="w-full max-w-sm space-y-5">
              <div className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                  {t("auth.registerForm.avatarModal.previewLabel")}
                </p>
                <PixelPreview sprite={sprite} size="lg" className="mx-auto" />
                <p className="text-sm text-slate-200/80">{t("auth.registerForm.avatarModal.fillHint")}</p>
              </div>
              {error ? (
                <p className="rounded-2xl border border-rose-400/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </p>
              ) : null}
              {status === "saved" && (
                <p className="text-xs text-emerald-300">{t("avatarPage.designer.statusSaved")}</p>
              )}
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 min-w-[140px]"
                  onClick={handleCloseEditor}
                  disabled={status === "saving"}
                >
                  {t("avatarPage.designer.modal.close")}
                </Button>
                <Button
                  type="button"
                  className="flex-1 min-w-[140px]"
                  onClick={handleSave}
                  disabled={!hasChanges || !headFilled || !bodyFilled || status === "saving"}
                  aria-busy={status === "saving"}
                >
                  {t("avatarPage.designer.actions.save")}
                </Button>
              </div>
            </div>
          </div>
        </SpriteEditorModal>
      )}
    </Card>
  );
}

interface SpriteLayerCanvasProps {
  label: string;
  description?: string;
  layer: PixelLayer;
  columns: number;
  onPaint: (index: number) => void;
  highlight?: boolean;
  highlightMessage?: string;
  cellSize?: number;
  className?: string;
}

export function SpriteLayerCanvas({
  label,
  description,
  layer,
  columns,
  onPaint,
  highlight,
  highlightMessage,
  cellSize = 18,
  className,
}: SpriteLayerCanvasProps) {
  const filled = layer.filter(Boolean).length;
  const total = layer.length;

  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_15px_45px_rgba(2,6,23,0.35)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">
        <span>{label}</span>
        <span>{filled}/{total} px</span>
      </div>
      {description && (
        <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">{description}</p>
      )}
      {highlight && highlightMessage && <p className="text-xs text-amber-200">{highlightMessage}</p>}
      <div className="mt-2 overflow-auto">
        <div
          className="grid gap-[2px]"
          style={{ gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`, gridAutoRows: `${cellSize}px` }}
        >
          {layer.map((color, index) => (
            <button
              type="button"
              key={index}
              className={cn(
                "relative rounded-[4px] border border-white/15 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/80",
                color ? "shadow-[0_0_8px_rgba(255,255,255,0.25)]" : "bg-white/5",
              )}
              style={{ backgroundColor: color ?? undefined }}
              onClick={() => onPaint(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SpriteEditorModalProps {
  children: ReactNode;
  onClose: () => void;
  modeLabel: string;
  title: string;
  closeLabel: string;
}

function SpriteEditorModal({ children, onClose, modeLabel, title, closeLabel }: SpriteEditorModalProps) {
  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4">
      <div className="w-full max-w-5xl max-h-[92vh] space-y-5 overflow-y-auto rounded-3xl border border-white/15 bg-white/10 p-5 text-white shadow-[0_30px_100px_rgba(2,6,23,0.65)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/55">{modeLabel}</p>
            <h3 className="text-3xl font-semibold leading-tight">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80"
          >
            {closeLabel}
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

