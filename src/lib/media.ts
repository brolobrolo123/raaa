export const DEFAULT_AVATAR = "/avatars/default.svg";
const DEFAULT_COVER_COLOR = "#475569";

export function getAvatarUrl(image?: string | null) {
  if (!image) {
    return DEFAULT_AVATAR;
  }
  const trimmed = image.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_AVATAR;
}

const normalizeHex = (input?: string | null) => {
  if (!input) return null;
  const value = input.trim();
  if (/^#([0-9a-f]{6})$/i.test(value)) {
    return value.toLowerCase();
  }
  if (/^#([0-9a-f]{3})$/i.test(value)) {
    const expanded = value
      .slice(1)
      .split("")
      .map((char) => char + char)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }
  return null;
};

export function getCoverAccentColor(color?: string | null) {
  return normalizeHex(color) ?? DEFAULT_COVER_COLOR;
}

export function getCoverBackgroundStyles(image?: string | null, color?: string | null) {
  const accent = getCoverAccentColor(color);
  if (image) {
    return {
      backgroundImage: `url(${image})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    } as const;
  }
  return {
    background: `linear-gradient(135deg, ${accent}22, ${accent}55)`,
  } as const;
}

export function getCoverBorderColor(image?: string | null, color?: string | null) {
  if (image) {
    return "rgba(255,255,255,0.18)";
  }
  const accent = getCoverAccentColor(color);
  return `${accent}66`;
}
