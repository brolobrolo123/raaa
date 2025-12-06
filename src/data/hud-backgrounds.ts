export type HudBackgroundPreset = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  src: string;
  ownerOnly?: boolean;
};

export const HUD_BACKGROUND_PRESETS: HudBackgroundPreset[] = [
  {
    id: "fondo1",
    labelKey: "avatarPage.backgroundPresets.fondo1.title",
    descriptionKey: "avatarPage.backgroundPresets.fondo1.description",
    src: "/hud-backgrounds/fondo1.jpg",
  },
  {
    id: "fondo2",
    labelKey: "avatarPage.backgroundPresets.fondo2.title",
    descriptionKey: "avatarPage.backgroundPresets.fondo2.description",
    src: "/hud-backgrounds/fondo2.jpg",
  },
  {
    id: "fondo3",
    labelKey: "avatarPage.backgroundPresets.fondo3.title",
    descriptionKey: "avatarPage.backgroundPresets.fondo3.description",
    src: "/hud-backgrounds/fondo3.jpg",
  },
  {
    id: "fondo4",
    labelKey: "avatarPage.backgroundPresets.fondo4.title",
    descriptionKey: "avatarPage.backgroundPresets.fondo4.description",
    src: "/hud-backgrounds/fondo4.jpg",
  },
  {
    id: "fondo5",
    labelKey: "avatarPage.backgroundPresets.fondo5.title",
    descriptionKey: "avatarPage.backgroundPresets.fondo5.description",
    src: "/hud-backgrounds/fondo5.jpg",
  },
  {
    id: "fondoespecial",
    labelKey: "avatarPage.backgroundPresets.fondoespecial.title",
    descriptionKey: "avatarPage.backgroundPresets.fondoespecial.description",
    src: "/hud-backgrounds/fondoespecial.gif",
    ownerOnly: true,
  },
];
