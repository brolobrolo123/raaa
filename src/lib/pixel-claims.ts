import { PixelRegion } from "@prisma/client";
import { serializePixelSprite, type PixelSprite } from "@/lib/pixel-avatar";

export type PixelClaimInput = {
  slotIndex: number;
  region: PixelRegion;
  pixelIndex: number;
  color: string;
};

export class DuplicateMonochromeColorError extends Error {}

const MONOCHROME_SENTINEL = -1;
const PATTERN_SENTINEL = -2;

const isMonochromeLayer = (layer: (string | null)[]): layer is string[] => {
  const firstColor = layer[0];
  if (!firstColor) return false;
  return layer.every((color) => color === firstColor);
};

const buildMonochromeClaims = (designs: PixelSprite[]): PixelClaimInput[] => {
  const claims: PixelClaimInput[] = [];
  const seen = new Set<string>();
  designs.forEach((design, slotIndex) => {
    (Object.keys(design) as (keyof PixelSprite)[]).forEach((key) => {
      const layer = design[key];
      if (!isMonochromeLayer(layer)) {
        return;
      }
      const color = layer[0]!;
      const identity = `${key}:${color}`;
      if (seen.has(identity)) {
        throw new DuplicateMonochromeColorError();
      }
      seen.add(identity);
      claims.push({
        slotIndex,
        region: key === "head" ? PixelRegion.HEAD : PixelRegion.BODY,
        pixelIndex: MONOCHROME_SENTINEL,
        color,
      });
    });
  });
  return claims;
};

const buildPatternClaims = (designs: PixelSprite[], defaultSignature: string): PixelClaimInput[] => {
  const claims: PixelClaimInput[] = [];
  const seen = new Set<string>();
  designs.forEach((design, slotIndex) => {
    const signature = serializePixelSprite(design);
    if (signature === defaultSignature) {
      return;
    }
    if (seen.has(signature)) {
      return;
    }
    seen.add(signature);
    claims.push({
      slotIndex,
      region: PixelRegion.HEAD,
      pixelIndex: PATTERN_SENTINEL,
      color: signature,
    });
  });
  return claims;
};

export const buildSpriteClaims = (designs: PixelSprite[], defaultSignature: string): PixelClaimInput[] => {
  const monochromeClaims = buildMonochromeClaims(designs);
  const patternClaims = buildPatternClaims(designs, defaultSignature);
  return [...monochromeClaims, ...patternClaims];
};
