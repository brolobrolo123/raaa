export type UpgradeType = "hp" | "damage" | "evasion";

const HP_DAMAGE_LEVEL_COUNT = 50;
const EVASION_LEVEL_COUNT = 20;

export const HP_INCREMENT = 100;
export const DAMAGE_INCREMENT = 1;
export const EVASION_INCREMENT = 1;

const hpDamageCosts: number[] = Array.from({ length: HP_DAMAGE_LEVEL_COUNT }, (_, index) => {
  const level = index + 1;
  if (level === 1) return 5;
  if (level === 2) return 10;
  if (level === 3) return 30;
  if (level === 4) return 40;
  if (level === 5) return 50;
  if (level <= 20) {
    return 40 + (level - 4) * 10;
  }
  if (level <= 40) {
    return 200 + (level - 20) * 100;
  }
  return 500;
});

const evasionCosts: number[] = Array.from({ length: EVASION_LEVEL_COUNT }, (_, index) => {
  const level = index + 1;
  if (level === 1) return 20;
  if (level === 2) return 50;
  if (level === 3) return 100;
  if (level === 4) return 150;
  if (level === 5) return 200;
  if (level <= 10) {
    return 200 + (level - 5) * 100;
  }
  if (level <= 15) {
    return 700 + (level - 10) * 250;
  }
  return 1950 + (level - 15) * 1000;
});

export const UPGRADE_LIMITS: Record<UpgradeType, number> = {
  hp: HP_DAMAGE_LEVEL_COUNT,
  damage: HP_DAMAGE_LEVEL_COUNT,
  evasion: EVASION_LEVEL_COUNT,
};

export const UPGRADE_COSTS: Record<UpgradeType, readonly number[]> = {
  hp: hpDamageCosts,
  damage: hpDamageCosts.slice(),
  evasion: evasionCosts,
};

export function getNextUpgradeCost(type: UpgradeType, currentUpgrades: number): number | null {
  if (currentUpgrades >= UPGRADE_LIMITS[type]) {
    return null;
  }
  return UPGRADE_COSTS[type][currentUpgrades] ?? null;
}
