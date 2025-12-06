import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildDefaultFabSpriteCollection,
  cloneSprite,
  parseFabSpriteCollection,
  serializeFabSpriteCollection,
  type FabSpriteCollection,
  type PixelSprite,
  MAX_SPRITE_SLOTS,
} from "@/lib/pixel-avatar";

export const DEFAULT_FAB_SPRITE_KEY = "defaultFabPixelSprite";
const DEFAULT_SERIALIZED_SPRITE = serializeFabSpriteCollection(buildDefaultFabSpriteCollection());

const isMissingTableError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

export async function getDefaultFabSpriteSerialized(): Promise<string> {
  try {
    const record = await prisma.siteSetting.findUnique({ where: { key: DEFAULT_FAB_SPRITE_KEY } });
    return record?.value ?? DEFAULT_SERIALIZED_SPRITE;
  } catch (error) {
    if (isMissingTableError(error)) {
      console.warn("SiteSetting table missing, returning fallback Fab sprite. Run prisma migrate to create it.");
      return DEFAULT_SERIALIZED_SPRITE;
    }
    throw error;
  }
}

export async function getDefaultFabSpriteCollection(): Promise<FabSpriteCollection> {
  const serialized = await getDefaultFabSpriteSerialized();
  return parseFabSpriteCollection(serialized);
}

export async function getDefaultFabSprite(): Promise<PixelSprite> {
  const collection = await getDefaultFabSpriteCollection();
  return cloneSprite(collection.designs[collection.activeSlot]);
}

export async function saveDefaultFabSprite(sprite: PixelSprite): Promise<string> {
  const payload: FabSpriteCollection = buildDefaultFabSpriteCollection();
  payload.activeSlot = 0;
  payload.designs = Array.from({ length: MAX_SPRITE_SLOTS }, () => cloneSprite(sprite));
  const serialized = serializeFabSpriteCollection(payload);
  try {
    await prisma.siteSetting.upsert({
      where: { key: DEFAULT_FAB_SPRITE_KEY },
      update: { value: serialized },
      create: { key: DEFAULT_FAB_SPRITE_KEY, value: serialized },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      console.error("SiteSetting table missing. Run database migrations before editing base sprite.");
      throw new Error("No se pudo guardar la silueta base. Ejecuta las migraciones de Prisma primero.");
    }
    throw error;
  }
  return serialized;
}
