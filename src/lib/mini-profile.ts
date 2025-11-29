export const MINI_PROFILE_ACCENTS = [
  "#0f172a",
  "#1c1b3a",
  "#2b1342",
  "#032f2f",
  "#3a1b1b",
  "#0a2f54",
  "#2b1f48",
  "#301b3f",
] as const;

export type MiniProfileAccent = (typeof MINI_PROFILE_ACCENTS)[number];

export const DEFAULT_MINI_PROFILE_ACCENT: MiniProfileAccent = MINI_PROFILE_ACCENTS[0];

export function resolveMiniProfileAccent(input?: string | null): MiniProfileAccent {
  if (!input) {
    return DEFAULT_MINI_PROFILE_ACCENT;
  }
  const normalized = input.trim().toLowerCase();
  const match = MINI_PROFILE_ACCENTS.find((color) => color.toLowerCase() === normalized);
  return (match ?? DEFAULT_MINI_PROFILE_ACCENT) as MiniProfileAccent;
}

export function isValidMiniProfileAccent(value: string): value is MiniProfileAccent {
  return MINI_PROFILE_ACCENTS.some((color) => color === value);
}
