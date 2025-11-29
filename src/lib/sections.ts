import type { Locale } from "@/lib/i18n/dictionaries";

type LocalizedString = Record<Locale, string>;

interface SectionDefinition {
  name: LocalizedString;
  description: LocalizedString;
  example?: LocalizedString;
  accentColor: string;
  tagline: LocalizedString;
  icon: string;
}

const definitions = {
  "historia-alternativa": {
    name: {
      es: "Qué hubiera pasado si…",
      en: "What would have happened if…",
    },
    description: {
      es: "Ideas o historias que imaginan cómo habría sido el mundo si un evento del pasado hubiera ocurrido diferente.",
      en: "Ideas and stories that imagine how the world might look if a past event had played out differently.",
    },
    example: {
      es: "¿Qué habría pasado si tal presidente no hubiera ganado?",
      en: "What if that president had never won?",
    },
    accentColor: "#2563eb",
    tagline: {
      es: "Ideas que imaginan otros desenlaces históricos.",
      en: "Ideas that explore alternate historic outcomes.",
    },
    icon: "⏳",
  },
  "nueva-mirada-a-la-historia": {
    name: {
      es: "Una Interpretación Distinta",
      en: "A Different Interpretation",
    },
    description: {
      es: "Opiniones o análisis que intentan explicar un suceso histórico de una forma distinta a la versión tradicional.",
      en: "Opinions or analyses that reinterpret a historical event beyond the traditional narrative.",
    },
    example: {
      es: "Creo que este personaje hizo esto por otra razón.",
      en: "I think this figure acted for a different reason.",
    },
    accentColor: "#0d9488",
    tagline: {
      es: "Opiniones que rompen la versión oficial.",
      en: "Perspectives that break the official story.",
    },
    icon: "🧠",
  },
  "teorias-conspirativas": {
    name: {
      es: "Teorías Conspirativas",
      en: "Conspiracy Theories",
    },
    description: {
      es: "Ideas que dicen que lo que pasó en la historia fue manipulado, ocultado o controlado.",
      en: "Ideas claiming historical events were manipulated, hidden, or controlled.",
    },
    example: {
      es: "Un grupo poderoso controló el evento desde las sombras.",
      en: "A powerful group controlled the event from the shadows.",
    },
    accentColor: "#f97316",
    tagline: {
      es: "Ideas sobre hechos manipulados y ocultos.",
      en: "Perspectives about hidden or manipulated events.",
    },
    icon: "🛰️",
  },
} as const satisfies Record<string, SectionDefinition>;

export const SECTION_DEFINITIONS = definitions;

export type SectionSlug = keyof typeof SECTION_DEFINITIONS;

export const SECTION_SLUGS = Object.keys(SECTION_DEFINITIONS) as SectionSlug[];

export function getSectionCopy(slug: SectionSlug, locale: Locale) {
  const definition = SECTION_DEFINITIONS[slug];
  return {
    name: definition.name[locale],
    description: definition.description[locale],
    example: definition.example?.[locale],
    tagline: definition.tagline[locale],
  };
}
