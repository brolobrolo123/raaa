"use client";

import { useEffect, useMemo, useState } from "react";
import { Paintbrush, Eraser, PaintBucket, Pipette, Trash2 } from "lucide-react";
import { SpriteLayerCanvas } from "@/components/profile/fab-sprite-designer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BODY_CANVAS,
  HEAD_CANVAS,
  PIXEL_DEFAULT_PALETTE,
  cloneSprite,
  createEmptySprite,
  parseFabSpriteCollection,
  type PixelSprite,
} from "@/lib/pixel-avatar";

interface BaseSpriteEditorProps {
  initialSprite: string;
}

type Status = "idle" | "saving" | "saved";
type Tool = "paint" | "erase" | "fill" | "eyedropper";

export function BaseSpriteEditor({ initialSprite }: BaseSpriteEditorProps) {
  const parsed = parseFabSpriteCollection(initialSprite);
  const [sprite, setSprite] = useState<PixelSprite>(() => cloneSprite(parsed.designs[parsed.activeSlot]));
  const [baseline, setBaseline] = useState<PixelSprite>(() => cloneSprite(parsed.designs[parsed.activeSlot]));
  const [selectedColor, setSelectedColor] = useState<string | null>(PIXEL_DEFAULT_PALETTE[0]);
  const [customColor, setCustomColor] = useState<string>(PIXEL_DEFAULT_PALETTE[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<"head" | "body">("head");
  const [tool, setTool] = useState<Tool>("paint");

  useEffect(() => {
    const nextParsed = parseFabSpriteCollection(initialSprite);
    const nextSprite = cloneSprite(nextParsed.designs[nextParsed.activeSlot]);
    setSprite(nextSprite);
    setBaseline(cloneSprite(nextSprite));
    setActiveLayer("head");
  }, [initialSprite]);

  const palette = useMemo(() => {
    const unique = [...PIXEL_DEFAULT_PALETTE];
    if (!unique.includes(customColor)) {
      unique.push(customColor);
    }
    return unique;
  }, [customColor]);

  const hasChanges = useMemo(
    () =>
      sprite.head.some((pixel, index) => pixel !== baseline.head[index]) ||
      sprite.body.some((pixel, index) => pixel !== baseline.body[index]),
    [sprite, baseline],
  );

  const headFilled = useMemo(() => sprite.head.some(Boolean), [sprite.head]);
  const bodyFilled = useMemo(() => sprite.body.some(Boolean), [sprite.body]);

  const applyColor = (layer: keyof PixelSprite, index: number, color: string | null) => {
    setSprite((prev) => {
      if ((prev[layer][index] ?? null) === color) {
        return prev;
      }
      const next = cloneSprite(prev);
      next[layer][index] = color;
      return next;
    });
  };

  const getLayerColumns = (layer: keyof PixelSprite) => (layer === "head" ? HEAD_CANVAS.cols : BODY_CANVAS.cols);

  const fillRegion = (layer: keyof PixelSprite, index: number) => {
    const fillColor = selectedColor ?? null;
    if (fillColor === null) {
      return;
    }
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
      let mutated = false;
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
  };

  const handleCanvasClick = (layer: keyof PixelSprite, index: number) => {
    if (tool === "eyedropper") {
      const color = sprite[layer][index] ?? null;
      setSelectedColor(color);
      if (color) {
        setCustomColor(color);
      }
      setTool("paint");
      return;
    }
    if (tool === "fill") {
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

  const handleSave = async () => {
    if (!headFilled || !bodyFilled) {
      setError("Completa la silueta antes de guardar.");
      return;
    }
    if (!hasChanges) return;
    setStatus("saving");
    setError(null);
    try {
      const response = await fetch("/api/panel/avatar/base-sprite", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprite }),
      });
      if (!response.ok) {
        throw new Error("No se pudo actualizar la silueta base");
      }
      const payload = (await response.json()) as { sprite: string };
      const parsedResponse = parseFabSpriteCollection(payload.sprite);
      const savedSprite = cloneSprite(parsedResponse.designs[parsedResponse.activeSlot]);
      setSprite(cloneSprite(savedSprite));
      setBaseline(cloneSprite(savedSprite));
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch (caught) {
      console.error(caught);
      setError(caught instanceof Error ? caught.message : "Error inesperado al guardar");
      setStatus("idle");
    }
  };

  const handleClearAll = () => {
    setSprite(createEmptySprite());
    setTool("paint");
  };

  return (
    <Card className="border border-white/10 bg-slate-950/70 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Silueta base</p>
          <h3 className="text-2xl font-semibold text-white">Editor global de píxeles</h3>
          <p className="text-sm text-white/70">
            Cualquier usuario que se registre después de guardar recibirá esta silueta como punto de partida.
          </p>
        </div>
        <div className="text-right text-sm">
          {error && <p className="text-rose-300">{error}</p>}
          {status === "saved" && <p className="text-emerald-300">Silueta actualizada</p>}
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Cambios {hasChanges ? "pendientes" : "guardados"}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="space-y-4">
          <div className="space-y-4 rounded-3xl border border-white/10 bg-[#050a16]/80 p-4">
            <div className="flex gap-3">
              {(["head", "body"] as const).map((layerKey) => (
                <button
                  key={layerKey}
                  type="button"
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] ${
                    activeLayer === layerKey
                      ? "border-white bg-white/10 text-white"
                      : "border-white/20 text-white/60 hover:border-white/40 hover:text-white"
                  }`}
                  onClick={() => setActiveLayer(layerKey)}
                >
                  {layerKey === "head" ? "Casco" : "Armadura"}
                </button>
              ))}
            </div>
            <SpriteLayerCanvas
              label={activeLayer === "head" ? "Casco" : "Armadura"}
              description={
                activeLayer === "head" ? "Define la cabeza común" : "Ajusta la armadura y cuerpo"
              }
              layer={activeLayer === "head" ? sprite.head : sprite.body}
              columns={activeLayer === "head" ? HEAD_CANVAS.cols : BODY_CANVAS.cols}
              onPaint={(index) => handleCanvasClick(activeLayer, index)}
              highlight={activeLayer === "head" ? !headFilled : !bodyFilled}
              className="w-full lg:min-w-[520px]"
              cellSize={22}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                  tool === "paint"
                    ? "border-white bg-white/10 text-white"
                    : "border-white/30 text-white/60 hover:border-white/50 hover:text-white"
                }`}
                onClick={() => setTool("paint")}
                aria-label="Pincel"
                title="Pincel"
              >
                <Paintbrush className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                  tool === "erase"
                    ? "border-white bg-white/10 text-white"
                    : "border-white/30 text-white/60 hover:border-white/50 hover:text-white"
                }`}
                onClick={() => setTool("erase")}
                aria-label="Borrar"
                title="Borrar"
              >
                <Eraser className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                  tool === "fill"
                    ? "border-white bg-white/10 text-white"
                    : "border-white/30 text-white/60 hover:border-white/50 hover:text-white"
                } ${selectedColor === null ? "cursor-not-allowed opacity-40" : ""}`}
                onClick={() => {
                  if (selectedColor === null) return;
                  setTool("fill");
                }}
                aria-label="Rellenar"
                title="Rellenar"
              >
                <PaintBucket className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                  tool === "eyedropper"
                    ? "border-white bg-white/10 text-white"
                    : "border-white/30 text-white/60 hover:border-white/50 hover:text-white"
                }`}
                onClick={() => setTool("eyedropper")}
                aria-label="Gotero"
                title="Gotero"
              >
                <Pipette className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-400/60 text-rose-100 transition hover:border-rose-300 hover:text-rose-50"
                onClick={handleClearAll}
                aria-label="Limpiar todo"
                title="Limpiar todo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="primary" disabled={!hasChanges || status === "saving"} loading={status === "saving"} onClick={handleSave}>
              Guardar silueta
            </Button>
            <Button type="button" variant="ghost" disabled={!hasChanges} onClick={() => setSprite(cloneSprite(baseline))}>
              Deshacer cambios
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Colores rápidos</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {palette.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-10 w-10 rounded-2xl border-2 ${selectedColor === color ? "border-white" : "border-transparent"}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Elegir color ${color}`}
                />
              ))}
              <button
                type="button"
                onClick={() => setSelectedColor(null)}
                className={`flex h-10 w-16 items-center justify-center rounded-2xl border-2 border-dashed text-xs ${selectedColor === null ? "border-white text-white" : "border-white/40 text-white/60"}`}
              >
                Borrar
              </button>
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm text-white/70">
            <span>Color personalizado</span>
            <input
              type="color"
              value={customColor}
              onChange={(event) => {
                setCustomColor(event.target.value);
                setSelectedColor(event.target.value);
              }}
              className="h-10 w-16 cursor-pointer rounded-lg border border-white/20 bg-transparent"
            />
          </label>
        </div>
      </div>
    </Card>
  );
}
