import { DEFAULT_PIXEL_SPRITE, serializePixelSprite } from "@/lib/pixel-avatar";

export type ClubSlug = "gaming" | "anime-manga" | "misterios-conspiraciones" | "cine-series";

type AttachmentType = "image" | "gif";

export interface ClubChatAttachment {
  type: AttachmentType;
  url: string;
  alt: string;
}

export interface ClubChatSeedMessage {
  id: string;
  username: string;
  displayName: string;
  avatarImage?: string;
  body: string;
  timestamp: string;
  attachments?: ClubChatAttachment[];
}

export interface ClubModerator {
  username: string;
  displayName: string;
  avatarImage?: string;
  pixelSprite?: string | null;
  badgeLabel: string;
}

export interface ClubDefinition {
  slug: ClubSlug;
  name: string;
  description: string;
  tagline: string;
  icon: string;
  accentColor: string;
  heroGradient: string;
  welcomeMessage: string;
  rules: string[];
  moderators: ClubModerator[];
  chatPreview: ClubChatSeedMessage[];
}

const DEFAULT_SPRITE_STRING = serializePixelSprite(DEFAULT_PIXEL_SPRITE);

export const CLUB_DEFINITIONS: Record<ClubSlug, ClubDefinition> = {
  gaming: {
    slug: "gaming",
    name: "Club Gaming",
    description: "Scrims nocturnos, metas parche a parche y squads abiertos para los que nunca bajan el control.",
    tagline: "Coordina partidas ranked, arma collabs y presume tus setups.",
    icon: "/club-icons/gaming.png",
    accentColor: "#0ea5e9",
    heroGradient: "linear-gradient(140deg, rgba(14,165,233,0.65), rgba(2,6,23,0.95))",
    welcomeMessage: "Comparte tus highlights y arma dúos en segundos.",
    rules: [
      "Respeta el MMR de los demás: nada de flamear si alguien está aprendiendo.",
      "Etiqueta el juego en cada publicación para organizar scrims más rápido.",
      "Clips o imágenes deben incluir el contexto del partido para evitar spam.",
    ],
    moderators: [
      {
        username: "kaori",
        displayName: "Kaori",
        avatarImage: "/avatars/default.svg",
        pixelSprite: DEFAULT_SPRITE_STRING,
        badgeLabel: "Coach táctico",
      },
      {
        username: "wolfpack",
        displayName: "Wolfpack",
        avatarImage: "/avatars/default.svg",
        pixelSprite: DEFAULT_SPRITE_STRING,
        badgeLabel: "Shotcaller",
      },
    ],
    chatPreview: [
      {
        id: "gaming-1",
        username: "kaori",
        displayName: "Kaori",
        avatarImage: "/avatars/default.svg",
        body: "Tengo cupo para scrim mañana 22:00 GMT-5, mapa abierto a votación. ¿Quién se apunta?",
        timestamp: new Date().toISOString(),
      },
      {
        id: "gaming-2",
        username: "wolfpack",
        displayName: "Wolfpack",
        avatarImage: "/avatars/default.svg",
        body: "Les dejo mi build actualizada para support agresivo, funciona brutal con rotaciones rápidas.",
        timestamp: new Date().toISOString(),
        attachments: [
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1605902711622-cfb43c4437b5?auto=format&fit=crop&w=600&q=80",
            alt: "Setup gamer",
          },
        ],
      },
    ],
  },
  "anime-manga": {
    slug: "anime-manga",
    name: "Club Anime y Manga",
    description: "Spoiler talks responsables, watch parties y fanart colaborativo para cada temporada.",
    tagline: "Organiza maratones y comparte paneles favoritos antes que nadie.",
    icon: "/club-icons/anime-manga.png",
    accentColor: "#f97316",
    heroGradient: "linear-gradient(140deg, rgba(249,115,22,0.65), rgba(15,23,42,0.95))",
    welcomeMessage: "Cada semana armamos watchlist y retos de dibujo.",
    rules: [
      "Marca tus spoilers indicando episodio o capítulo.",
      "Fanarts deben acreditar artistas y especificar si permiten repost.",
      "No se permite compartir enlaces pirata en abierto.",
    ],
    moderators: [
      {
        username: "celeste",
        displayName: "Celeste",
        avatarImage: "/avatars/default.svg",
        pixelSprite: DEFAULT_SPRITE_STRING,
        badgeLabel: "Curadora de watchlist",
      },
      {
        username: "shiro",
        displayName: "Shiro",
        avatarImage: "/avatars/default.svg",
        pixelSprite: DEFAULT_SPRITE_STRING,
        badgeLabel: "Guardiana de fanart",
      },
    ],
    chatPreview: [
      {
        id: "anime-1",
        username: "celeste",
        displayName: "Celeste",
        avatarImage: "/avatars/default.svg",
        body: "Mañana vemos el episodio 8 de Nocturna, prepárense para teorías locas.",
        timestamp: new Date().toISOString(),
      },
      {
        id: "anime-2",
        username: "shiro",
        displayName: "Shiro",
        avatarImage: "/avatars/default.svg",
        body: "Comparto este panel reh hecho con acuarelas, acepto feedback ♥",
        timestamp: new Date().toISOString(),
        attachments: [
          {
            type: "gif",
            url: "https://media.giphy.com/media/l0HUpt2s9Pclgt9Vm/giphy.gif",
            alt: "Gif anime",
          },
        ],
      },
    ],
  },
  "misterios-conspiraciones": {
    slug: "misterios-conspiraciones",
    name: "Club Misterios y Conspiraciones",
    description: "Mapas, cronologías y documentos filtrados para quienes siguen pistas a medianoche.",
    tagline: "Comparte expedientes y arma hilos colaborativos.",
    icon: "/club-icons/misterios-conspiraciones.png",
    accentColor: "#6d28d9",
    heroGradient: "linear-gradient(140deg, rgba(109,40,217,0.65), rgba(2,6,23,0.95))",
    welcomeMessage: "Cada semana abrimos un caso y recopilamos indicios verificados.",
    rules: [
      "Documenta las fuentes y marca qué es teoría vs. evidencia.",
      "Evita nombres reales si la investigación sigue activa.",
      "Las imágenes se redactan si contienen datos sensibles.",
    ],
    moderators: [
      {
        username: "noctis",
        displayName: "Noctis",
        avatarImage: "/avatars/default.svg",
        pixelSprite: DEFAULT_SPRITE_STRING,
        badgeLabel: "Archivista",
      },
      {
        username: "halley",
        displayName: "Halley",
        avatarImage: "/avatars/default.svg",
        pixelSprite: DEFAULT_SPRITE_STRING,
        badgeLabel: "Curadora de teorías",
      },
    ],
    chatPreview: [
      {
        id: "misterios-1",
        username: "noctis",
        displayName: "Noctis",
        avatarImage: "/avatars/default.svg",
        body: "Encontré coincidencias entre los símbolos del mural y la bitácora 1986.",
        timestamp: new Date().toISOString(),
      },
      {
        id: "misterios-2",
        username: "halley",
        displayName: "Halley",
        avatarImage: "/avatars/default.svg",
        body: "Adjunto recorte con las coordenadas resaltadas.",
        timestamp: new Date().toISOString(),
        attachments: [
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80",
            alt: "Mapa misterioso",
          },
        ],
      },
    ],
  },
  "cine-series": {
    slug: "cine-series",
    name: "Club Cine y Series",
    description: "Análisis cuadro a cuadro, listas de maratón y debates sobre finales polémicos.",
    tagline: "Coordina watch parties y comparte reseñas exprés.",
    icon: "/club-icons/cine-series.png",
    accentColor: "#fbbf24",
    heroGradient: "linear-gradient(140deg, rgba(251,191,36,0.55), rgba(15,23,42,0.95))",
    welcomeMessage: "Cada domingo votamos la mejor escena de la semana.",
    rules: [
      "Etiqueta spoilers por temporada y minuto aproximado.",
      "No compartas enlaces a descargas no oficiales.",
      "Las reseñas deben incluir calificación y apartado técnico.",
    ],
    moderators: [
      {
        username: "lumen",
        displayName: "Lumen",
        avatarImage: "/avatars/default.svg",
        pixelSprite: DEFAULT_SPRITE_STRING,
        badgeLabel: "Curadora de watchlist",
      },
      {
        username: "orion",
        displayName: "Orion",
        avatarImage: "/avatars/default.svg",
        pixelSprite: DEFAULT_SPRITE_STRING,
        badgeLabel: "Moderador de debates",
      },
    ],
    chatPreview: [
      {
        id: "cine-1",
        username: "lumen",
        displayName: "Lumen",
        avatarImage: "/avatars/default.svg",
        body: "Hoy analizamos el plano secuencia final de Aurora City, dejen sus preguntas.",
        timestamp: new Date().toISOString(),
      },
      {
        id: "cine-2",
        username: "orion",
        displayName: "Orion",
        avatarImage: "/avatars/default.svg",
        body: "Subo mi plantilla para reseñas express, úsenla si quieren uniformidad.",
        timestamp: new Date().toISOString(),
        attachments: [
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80",
            alt: "Set de cine",
          },
        ],
      },
    ],
  },
};

export const CLUB_SLUGS = Object.keys(CLUB_DEFINITIONS) as ClubSlug[];

export function getClubDefinition(slug: string | null | undefined): ClubDefinition | null {
  if (!slug) {
    return null;
  }
  const normalized = slug.toLowerCase() as ClubSlug;
  return CLUB_DEFINITIONS[normalized] ?? null;
}
