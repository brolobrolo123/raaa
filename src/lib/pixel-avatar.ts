export const HEAD_CANVAS = { cols: 20, rows: 20 } as const;
export const BODY_CANVAS = { cols: 20, rows: 20 } as const;
export const HEAD_CELL_COUNT = HEAD_CANVAS.cols * HEAD_CANVAS.rows;
export const BODY_CELL_COUNT = BODY_CANVAS.cols * BODY_CANVAS.rows;
const PREVIOUS_HEAD_CANVAS = { cols: 16, rows: 16 } as const;
const PREVIOUS_BODY_CANVAS = { cols: 16, rows: 24 } as const;
const PREVIOUS_TALL_BODY_CANVAS = { cols: 20, rows: 30 } as const;
const LEGACY_HEAD_CANVAS = { cols: 12, rows: 12 } as const;
const LEGACY_BODY_CANVAS = { cols: 12, rows: 16 } as const;
const PREVIOUS_HEAD_CELL_COUNT = PREVIOUS_HEAD_CANVAS.cols * PREVIOUS_HEAD_CANVAS.rows;
const PREVIOUS_BODY_CELL_COUNT = PREVIOUS_BODY_CANVAS.cols * PREVIOUS_BODY_CANVAS.rows;
const PREVIOUS_TALL_BODY_CELL_COUNT = PREVIOUS_TALL_BODY_CANVAS.cols * PREVIOUS_TALL_BODY_CANVAS.rows;
const LEGACY_HEAD_CELL_COUNT = LEGACY_HEAD_CANVAS.cols * LEGACY_HEAD_CANVAS.rows;
const LEGACY_BODY_CELL_COUNT = LEGACY_BODY_CANVAS.cols * LEGACY_BODY_CANVAS.rows;

export type PixelLayer = Array<string | null>;
export interface PixelSprite {
  head: PixelLayer;
  body: PixelLayer;
}

const GOLD = "#facc15";
const SKIN = "#fed7aa";
const EYE = "#0f172a";
const TEAL = "#22d3ee";
const MOUTH = "#ef4444";
const ACCENT = "#0ea5e9";
const STEEL = "#64748b";
const MIDNIGHT = "#0f172a";

const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizePixelColor(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return null;
  }
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

export function normalizeSpriteColors(sprite: PixelSprite): PixelSprite {
  return {
    head: sprite.head.map((color) => normalizePixelColor(color)),
    body: sprite.body.map((color) => normalizePixelColor(color)),
  };
}

export const PIXEL_DEFAULT_PALETTE = [
  EYE,
  GOLD,
  SKIN,
  TEAL,
  MOUTH,
  ACCENT,
  "#fde68a",
  "#f8fafc",
  STEEL,
  "#22d3ee",
];

const createEmptyLayer = (size: number): PixelLayer => new Array(size).fill(null);

export const createEmptySprite = (): PixelSprite => ({
  head: createEmptyLayer(HEAD_CELL_COUNT),
  body: createEmptyLayer(BODY_CELL_COUNT),
});

export const cloneSprite = (sprite: PixelSprite): PixelSprite => ({
  head: [...sprite.head],
  body: [...sprite.body],
});

const buildDefaultHeadLayer = (): PixelLayer => {
  const layer = createEmptyLayer(HEAD_CELL_COUNT);
  const crownRows = 4;
  const jawRows = 4;
  const eyeRow = 7;
  const mouthRow = 12;
  const eyeOffset = 6;
  const mouthPadding = 6;
  for (let row = 0; row < HEAD_CANVAS.rows; row += 1) {
    for (let col = 0; col < HEAD_CANVAS.cols; col += 1) {
      const index = row * HEAD_CANVAS.cols + col;
      if (row < crownRows) {
        layer[index] = GOLD;
        continue;
      }
      if (row >= HEAD_CANVAS.rows - jawRows) {
        layer[index] = MIDNIGHT;
        continue;
      }
      layer[index] = SKIN;
      if (row === eyeRow && (col === eyeOffset || col === HEAD_CANVAS.cols - eyeOffset - 1)) {
        layer[index] = EYE;
      }
      if (row === mouthRow && col >= mouthPadding && col < HEAD_CANVAS.cols - mouthPadding) {
        layer[index] = MOUTH;
      }
    }
  }
  return layer;
};

const buildDefaultBodyLayer = (): PixelLayer => {
  const layer = createEmptyLayer(BODY_CELL_COUNT);
  const collarRows = 4;
  const bootRows = 5;
  for (let row = 0; row < BODY_CANVAS.rows; row += 1) {
    for (let col = 0; col < BODY_CANVAS.cols; col += 1) {
      const index = row * BODY_CANVAS.cols + col;
      if (row < collarRows) {
        layer[index] = ACCENT;
        continue;
      }
      if (row >= BODY_CANVAS.rows - bootRows) {
        layer[index] = MIDNIGHT;
        continue;
      }
      layer[index] = TEAL;
    }
  }
  return layer;
};

export const DEFAULT_PIXEL_SPRITE: PixelSprite = {
  head: buildDefaultHeadLayer(),
  body: buildDefaultBodyLayer(),
};

export const MIN_SPRITE_SLOTS = 3;
export const MAX_SPRITE_SLOTS = 8;

export interface FabSpriteCollection {
  activeSlot: number;
  designs: PixelSprite[];
  unlockedSlots: number;
}

const normalizeLayer = (entry: unknown, size: number): PixelLayer => {
  const normalized = createEmptyLayer(size);
  if (!Array.isArray(entry)) {
    return normalized;
  }
  for (let i = 0; i < size; i += 1) {
    const value = entry[i];
    normalized[i] = typeof value === "string" ? value : null;
  }
  return normalized;
};

const remapLegacyLayer = (
  entry: unknown[],
  sourceCols: number,
  sourceRows: number,
  targetCols: number,
  targetRows: number,
): PixelLayer => {
  const target = createEmptyLayer(targetCols * targetRows);
  const rowOffset = Math.floor((targetRows - sourceRows) / 2);
  const colOffset = Math.floor((targetCols - sourceCols) / 2);
  for (let index = 0; index < entry.length; index += 1) {
    const value = entry[index];
    if (typeof value !== "string") continue;
    const sourceRow = Math.floor(index / sourceCols);
    const sourceCol = index % sourceCols;
    const targetRow = sourceRow + rowOffset;
    const targetCol = sourceCol + colOffset;
    if (targetRow < 0 || targetRow >= targetRows || targetCol < 0 || targetCol >= targetCols) {
      continue;
    }
    target[targetRow * targetCols + targetCol] = value;
  }
  return target;
};

const normalizeHeadLayer = (entry: unknown): PixelLayer => {
  if (Array.isArray(entry)) {
    const length = entry.length;
    if (length === LEGACY_HEAD_CELL_COUNT) {
      return remapLegacyLayer(
        entry,
        LEGACY_HEAD_CANVAS.cols,
        LEGACY_HEAD_CANVAS.rows,
        HEAD_CANVAS.cols,
        HEAD_CANVAS.rows,
      );
    }
    if (length === PREVIOUS_HEAD_CELL_COUNT) {
      return remapLegacyLayer(
        entry,
        PREVIOUS_HEAD_CANVAS.cols,
        PREVIOUS_HEAD_CANVAS.rows,
        HEAD_CANVAS.cols,
        HEAD_CANVAS.rows,
      );
    }
  }
  return normalizeLayer(entry, HEAD_CELL_COUNT);
};

const normalizeBodyLayer = (entry: unknown): PixelLayer => {
  if (Array.isArray(entry)) {
    const length = entry.length;
    if (length === LEGACY_BODY_CELL_COUNT) {
      return remapLegacyLayer(
        entry,
        LEGACY_BODY_CANVAS.cols,
        LEGACY_BODY_CANVAS.rows,
        BODY_CANVAS.cols,
        BODY_CANVAS.rows,
      );
    }
    if (length === PREVIOUS_BODY_CELL_COUNT) {
      return remapLegacyLayer(
        entry,
        PREVIOUS_BODY_CANVAS.cols,
        PREVIOUS_BODY_CANVAS.rows,
        BODY_CANVAS.cols,
        BODY_CANVAS.rows,
      );
    }
    if (length === PREVIOUS_TALL_BODY_CELL_COUNT) {
      return remapLegacyLayer(
        entry,
        PREVIOUS_TALL_BODY_CANVAS.cols,
        PREVIOUS_TALL_BODY_CANVAS.rows,
        BODY_CANVAS.cols,
        BODY_CANVAS.rows,
      );
    }
  }
  return normalizeLayer(entry, BODY_CELL_COUNT);
};

export const normalizeSpriteEntry = (entry?: unknown): PixelSprite => {
  if (entry && typeof entry === "object" && !Array.isArray(entry)) {
    const candidate = entry as Partial<Record<"head" | "body", unknown>>;
    return {
      head: normalizeHeadLayer(candidate.head),
      body: normalizeBodyLayer(candidate.body),
    };
  }
  if (Array.isArray(entry)) {
    return convertLegacyArray(entry);
  }
  return cloneSprite(DEFAULT_PIXEL_SPRITE);
};

const clampSlot = (value: unknown): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  const slot = Math.floor(value);
  if (slot < 0) {
    return 0;
  }
  if (slot >= MAX_SPRITE_SLOTS) {
    return MAX_SPRITE_SLOTS - 1;
  }
  return slot;
};

const clampUnlockedSlots = (value: unknown): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return MIN_SPRITE_SLOTS;
  }
  const normalized = Math.floor(value);
  if (normalized < MIN_SPRITE_SLOTS) {
    return MIN_SPRITE_SLOTS;
  }
  if (normalized > MAX_SPRITE_SLOTS) {
    return MAX_SPRITE_SLOTS;
  }
  return normalized;
};

export function buildDefaultFabSpriteCollection(): FabSpriteCollection {
  const defaults = Array.from({ length: MAX_SPRITE_SLOTS }, () => cloneSprite(DEFAULT_PIXEL_SPRITE));
  return { activeSlot: 0, designs: defaults, unlockedSlots: MIN_SPRITE_SLOTS };
}

export function parseFabSpriteCollection(input?: string | null): FabSpriteCollection {
  if (!input) {
    return buildDefaultFabSpriteCollection();
  }
  try {
    const data = JSON.parse(input);
    if (Array.isArray(data)) {
      return {
        activeSlot: 0,
        designs: [
          normalizeSpriteEntry(data),
          ...Array.from({ length: MAX_SPRITE_SLOTS - 1 }, () => cloneSprite(DEFAULT_PIXEL_SPRITE)),
        ],
        unlockedSlots: MIN_SPRITE_SLOTS,
      };
    }
    if (typeof data === "object" && data !== null) {
      const possibleDesigns = (data as Record<string, unknown>).designs;
      const rawDesigns: unknown[] = Array.isArray(possibleDesigns) ? possibleDesigns : [];
      const designs = Array.from({ length: MAX_SPRITE_SLOTS }, (_, index) => {
        if (index < rawDesigns.length) {
          return normalizeSpriteEntry(rawDesigns[index]);
        }
        return cloneSprite(DEFAULT_PIXEL_SPRITE);
      });
      const activeSlot = clampSlot((data as Record<string, unknown>).activeSlot ?? 0);
      const unlockedSlots = clampUnlockedSlots((data as Record<string, unknown>).unlockedSlots);
      return { activeSlot, designs, unlockedSlots };
    }
  } catch (error) {
    console.warn("Failed to parse pixel sprite", error);
  }
  return buildDefaultFabSpriteCollection();
}

export function serializeFabSpriteCollection(collection: FabSpriteCollection): string {
  const safeSlot = clampSlot(collection.activeSlot);
  const normalizedDesigns = Array.from({ length: MAX_SPRITE_SLOTS }, (_, index) => {
    const design = collection.designs[index] ?? cloneSprite(DEFAULT_PIXEL_SPRITE);
    return {
      head: normalizeLayer(design.head, HEAD_CELL_COUNT),
      body: normalizeLayer(design.body, BODY_CELL_COUNT),
    };
  });
  return JSON.stringify({
    activeSlot: safeSlot,
    designs: normalizedDesigns,
    unlockedSlots: clampUnlockedSlots(collection.unlockedSlots),
  });
}

export function parsePixelSprite(input?: string | null): PixelSprite {
  const collection = parseFabSpriteCollection(input);
  return cloneSprite(collection.designs[collection.activeSlot]);
}

export function serializePixelSprite(sprite: PixelSprite): string {
  return JSON.stringify({
    head: normalizeLayer(sprite.head, HEAD_CELL_COUNT),
    body: normalizeLayer(sprite.body, BODY_CELL_COUNT),
  });
}

function convertLegacyArray(entry: unknown[]): PixelSprite {
  const head = createEmptyLayer(HEAD_CELL_COUNT);
  const body = buildDefaultBodyLayer();
  const legacySize = Math.min(entry.length, 64);
  const legacyCols = 8;
  const legacyRows = 8;
  const rowOffset = Math.floor((HEAD_CANVAS.rows - legacyRows) / 2);
  const colOffset = Math.floor((HEAD_CANVAS.cols - legacyCols) / 2);
  for (let i = 0; i < legacySize; i += 1) {
    const value = entry[i];
    if (typeof value !== "string") continue;
    const row = Math.floor(i / legacyCols);
    const col = i % legacyCols;
    const targetRow = row + rowOffset;
    const targetCol = col + colOffset;
    if (targetRow < HEAD_CANVAS.rows && targetCol < HEAD_CANVAS.cols) {
      head[targetRow * HEAD_CANVAS.cols + targetCol] = value;
    }
  }
  return { head, body };
}
