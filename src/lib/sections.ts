import type { Locale } from "@/lib/i18n/dictionaries";

type LocalizedString = Record<Locale, string>;

interface SectionDefinitionBase {
  name: LocalizedString;
  description: LocalizedString;
  example?: LocalizedString;
  accentColor: string;
  tagline: LocalizedString;
  iconImage?: string;
}

const PRIMARY_SECTION_DEFINITIONS = {
  debate: {
    name: { es: "Debate", en: "Debate" },
    description: {
      es: "Conversaciones intensas sobre ideas que chocan: argumentos largos, réplicas y puntos de vista sin filtro.",
      en: "High-energy conversations where ideas collide through long-form arguments, rebuttals, and unfiltered takes.",
    },
    example: {
      es: "¿Por qué las polémicas necesitan una segunda mirada?",
      en: "Why do controversies deserve a second look?",
    },
    accentColor: "#f97316",
    tagline: {
      es: "Discute, refuta y sostén tu punto.",
      en: "Debate, refute, and defend your stance.",
    },
    iconImage: "/section-icons/debate.png",
  },
  "misterio-e-historias": {
    name: { es: "Misterio e Historias", en: "Mystery & Stories" },
    description: {
      es: "Para teorías que erizan la piel: relatos ocultos, anécdotas imposibles y preguntas sin respuesta.",
      en: "For goosebump theories, hidden tales, impossible anecdotes, and unanswered questions.",
    },
    example: {
      es: "La noche en la que todos juraron ver la misma sombra.",
      en: "The night everyone swore they saw the same shadow.",
    },
    accentColor: "#6366f1",
    tagline: {
      es: "Investiga lo raro, relata lo inexplicable.",
      en: "Investigate the odd, narrate the unexplainable.",
    },
    iconImage: "/section-icons/misterio-historias.png",
  },
  deportes: {
    name: { es: "Deportes", en: "Sports" },
    description: {
      es: "Resultados calientes, tácticas y cultura competitiva en cualquier cancha, pista o ring.",
      en: "Hot results, tactics, and competitive culture from any court, track, or ring.",
    },
    example: {
      es: "Plan perfecto para remontar en el último cuarto.",
      en: "A perfect plan to come back in the final quarter.",
    },
    accentColor: "#22c55e",
    tagline: {
      es: "Vive el ritmo del marcador.",
      en: "Live by the rhythm of the scoreboard.",
    },
    iconImage: "/section-icons/deportes.png",
  },
  friki: {
    name: { es: "Friki", en: "Geek" },
    description: {
      es: "Videojuegos, anime y gadgets para quienes no apagan la pantalla.",
      en: "Video games, anime, and gadgets for anyone who never powers down.",
    },
    example: {
      es: "¿Qué saga merece un remake urgente?",
      en: "Which saga deserves an urgent remake?",
    },
    accentColor: "#a855f7",
    tagline: {
      es: "Celebrar el hype es obligatorio.",
      en: "Celebrating hype is mandatory.",
    },
    iconImage: "/section-icons/friki.png",
  },
  ideas: {
    name: { es: "Ideas", en: "Ideas" },
    description: {
      es: "Donde nacen recomendaciones profundas sobre cine, libros o música que te mueven el piso.",
      en: "Where thoughtful recommendations on film, books, or music shake your routine.",
    },
    example: {
      es: "Tres discos para sobrevivir una semana pesada.",
      en: "Three albums to survive a heavy week.",
    },
    accentColor: "#facc15",
    tagline: {
      es: "Comparte aquello que te inspira.",
      en: "Share what keeps you inspired.",
    },
    iconImage: "/section-icons/ideas.png",
  },
  social: {
    name: { es: "Social", en: "Social" },
    description: {
      es: "Conecta con otros: presentaciones, squads y llamadas para buscar compañía o dúo.",
      en: "Connect with others—introductions, squad calls, and duo searches all live here.",
    },
    example: {
      es: "Busco partner nocturno para ranked.",
      en: "Looking for a late-night ranked partner.",
    },
    accentColor: "#0ea5e9",
    tagline: {
      es: "Haz ruido, encuentra a tu crew.",
      en: "Make noise, find your crew.",
    },
    iconImage: "/section-icons/social.png",
  },
} as const satisfies Record<string, SectionDefinitionBase>;

export type PrimarySectionSlug = keyof typeof PRIMARY_SECTION_DEFINITIONS;

const SECTION_TOPIC_DEFINITIONS = {
  "debate-criticas": {
    name: { es: "Críticas", en: "Critiques" },
    description: {
      es: "Juicios directos sobre decisiones, cine, personajes públicos o tendencias.",
      en: "Direct judgments about decisions, media, public figures, or trends.",
    },
    example: {
      es: "Un repaso sin filtros al discurso de moda.",
      en: "An unfiltered rundown of the trending speech.",
    },
    accentColor: "#fb923c",
    tagline: {
      es: "Dilo tal cual es.",
      en: "Say it exactly how it is.",
    },
    parentSlug: "debate",
  },
  "debate-politica": {
    name: { es: "Política", en: "Politics" },
    description: {
      es: "Argumentos sobre poder, instituciones y campañas.",
      en: "Arguments about power, institutions, and campaigns.",
    },
    example: {
      es: "Comparativa entre programas electorales.",
      en: "A comparison of election programs.",
    },
    accentColor: "#f97316",
    tagline: {
      es: "Debate la estrategia detrás del discurso.",
      en: "Debate the strategy behind every speech.",
    },
    parentSlug: "debate",
  },
  "debate-religion": {
    name: { es: "Religión", en: "Religion" },
    description: {
      es: "Conversaciones sobre fe, mística y choques culturales.",
      en: "Conversations on faith, mysticism, and cultural clashes.",
    },
    example: {
      es: "Debate sobre símbolos que cambian de significado.",
      en: "Debate around symbols whose meaning shifts.",
    },
    accentColor: "#fbbf24",
    tagline: {
      es: "Preguntas profundas sin tabú.",
      en: "Deep questions with no taboo.",
    },
    parentSlug: "debate",
  },
  "debate-pseudociencia": {
    name: { es: "Pseudociencia", en: "Pseudoscience" },
    description: {
      es: "Analiza teorías dudosas y desmonta engaños populares.",
      en: "Analyze sketchy theories and dismantle popular hoaxes.",
    },
    example: {
      es: "Por qué cierta moda \"wellness\" necesita evidencia.",
      en: "Why that wellness trend needs evidence.",
    },
    accentColor: "#f97316",
    tagline: {
      es: "Contrasta datos vs. rumores.",
      en: "Contrast data versus rumors.",
    },
    parentSlug: "debate",
  },
  "debate-funas": {
    name: { es: "Funas", en: "Call-outs" },
    description: {
      es: "Denuncias, explicaciones y contexto antes de cancelar algo o a alguien.",
      en: "Call-outs, context, and explanations before canceling something or someone.",
    },
    example: {
      es: "Cronología completa del escándalo.",
      en: "A full timeline of the scandal.",
    },
    accentColor: "#f43f5e",
    tagline: {
      es: "Expón con pruebas.",
      en: "Expose with receipts.",
    },
    parentSlug: "debate",
  },
  "misterio-teorias-conspirativas": {
    name: { es: "Teorías conspirativas", en: "Conspiracy Theories" },
    description: {
      es: "Historias de controles ocultos, sociedades secretas o mensajes cifrados.",
      en: "Stories about hidden control, secret societies, or coded messages.",
    },
    example: {
      es: "Mapa de pistas que conecta eventos extraños.",
      en: "A map of clues connecting strange events.",
    },
    accentColor: "#a855f7",
    tagline: {
      es: "Sigue el hilo en la oscuridad.",
      en: "Follow the thread in the dark.",
    },
    parentSlug: "misterio-e-historias",
  },
  "misterio-historia-alternativa": {
    name: { es: "Historia alternativa", en: "Alternate History" },
    description: {
      es: "Reimagina el pasado con giros improbables.",
      en: "Reimagine the past with improbable twists.",
    },
    example: {
      es: "Si cierto héroe hubiera tomado otra decisión.",
      en: "If that hero had taken a different decision.",
    },
    accentColor: "#818cf8",
    tagline: {
      es: "Un multiverso para cada suceso.",
      en: "A multiverse for every event.",
    },
    parentSlug: "misterio-e-historias",
  },
  "misterio-espacio": {
    name: { es: "Espacio", en: "Space" },
    description: {
      es: "Relatos y teorías sobre el cosmos, misiones y fenómenos raros.",
      en: "Stories and theories about the cosmos, missions, and rare phenomena.",
    },
    example: {
      es: "Hipótesis sobre una señal repetitiva.",
      en: "Hypothesis about a repeating signal.",
    },
    accentColor: "#4338ca",
    tagline: {
      es: "Apunta tu antena y escucha.",
      en: "Aim your antenna and listen.",
    },
    parentSlug: "misterio-e-historias",
  },
  "misterio-anecdotas": {
    name: { es: "Anécdotas", en: "Anecdotes" },
    description: {
      es: "Experiencias personales que parecen ficción.",
      en: "Personal experiences that feel like fiction.",
    },
    example: {
      es: "La vez que todos escucharon el mismo susurro.",
      en: "That time everyone heard the same whisper.",
    },
    accentColor: "#4c1d95",
    tagline: {
      es: "Comparte el misterio que viviste.",
      en: "Share the mystery you lived.",
    },
    parentSlug: "misterio-e-historias",
  },
  "deportes-futbol": {
    name: { es: "Fútbol", en: "Football" },
    description: {
      es: "Análisis táctico, fichajes y pasión por el balón.",
      en: "Tactical analysis, signings, and pure passion for the ball.",
    },
    example: {
      es: "Cómo anular el juego de posesión.",
      en: "How to neutralize possession-heavy teams.",
    },
    accentColor: "#16a34a",
    tagline: {
      es: "Respira 90 minutos de intensidad.",
      en: "Breathe 90 minutes of intensity.",
    },
    parentSlug: "deportes",
  },
  "deportes-baloncesto": {
    name: { es: "Baloncesto", en: "Basketball" },
    description: {
      es: "Playbooks, estadísticas avanzadas y cultura de la duela.",
      en: "Playbooks, advanced stats, and hardwood culture.",
    },
    example: {
      es: "¿Qué hace imparable a cierto combo guard?",
      en: "What makes that combo guard unstoppable?",
    },
    accentColor: "#f97316",
    tagline: {
      es: "Corre la cancha aún fuera de temporada.",
      en: "Run the court even off-season.",
    },
    parentSlug: "deportes",
  },
  "deportes-voleybol": {
    name: { es: "Vóleibol", en: "Volleyball" },
    description: {
      es: "Coberturas, rotaciones perfectas y vida de equipo.",
      en: "Coverage systems, perfect rotations, and team life.",
    },
    example: {
      es: "Notas desde la línea de saque.",
      en: "Notes from the service line.",
    },
    accentColor: "#facc15",
    tagline: {
      es: "Bloquea todo y celebra.",
      en: "Block everything and celebrate.",
    },
    parentSlug: "deportes",
  },
  "deportes-tenis": {
    name: { es: "Tenis", en: "Tennis" },
    description: {
      es: "Planos de saque, psicología y torneos.",
      en: "Serve maps, psychology, and tournament talk.",
    },
    example: {
      es: "El peso de un break point en la mente.",
      en: "The weight of a break point on the mind.",
    },
    accentColor: "#a3e635",
    tagline: {
      es: "Golpea con spin y argumentos.",
      en: "Hit with spin and arguments.",
    },
    parentSlug: "deportes",
  },
  "deportes-beisbol": {
    name: { es: "Béisbol", en: "Baseball" },
    description: {
      es: "Sabermetría, historias de clubhouse y series imposibles.",
      en: "Sabermetrics, clubhouse stories, and impossible series.",
    },
    example: {
      es: "El pitcheo que cambió la serie.",
      en: "The pitch that flipped the series.",
    },
    accentColor: "#2563eb",
    tagline: {
      es: "Calcula cada entrada.",
      en: "Calculate every inning.",
    },
    parentSlug: "deportes",
  },
  "deportes-artes-marciales": {
    name: { es: "Artes marciales", en: "Martial Arts" },
    description: {
      es: "Campamentos, técnicas y cultura del combate.",
      en: "Fight camps, technique, and combat culture.",
    },
    example: {
      es: "Claves para dominar el clinch.",
      en: "Keys to dominate the clinch.",
    },
    accentColor: "#dc2626",
    tagline: {
      es: "Respeta el dojo, analiza la pelea.",
      en: "Respect the dojo, break down the fight.",
    },
    parentSlug: "deportes",
  },
  "deportes-formula-1": {
    name: { es: "Fórmula 1", en: "Formula 1" },
    description: {
      es: "Telemetría, estrategias en pits y drama del paddock.",
      en: "Telemetry, pit strategies, and paddock drama.",
    },
    example: {
      es: "Lectura de degradación de neumáticos.",
      en: "Reading tire degradation charts.",
    },
    accentColor: "#ef4444",
    tagline: {
      es: "Siente el rebufo.",
      en: "Feel the slipstream.",
    },
    parentSlug: "deportes",
  },
  "deportes-skateboarding": {
    name: { es: "Skateboarding", en: "Skateboarding" },
    description: {
      es: "Spots, trucos y cultura urbana.",
      en: "Spots, tricks, and street culture.",
    },
    example: {
      es: "Recorrido por nuevos parques.",
      en: "Tour of new parks.",
    },
    accentColor: "#14b8a6",
    tagline: {
      es: "Persigue la línea perfecta.",
      en: "Chase the perfect line.",
    },
    parentSlug: "deportes",
  },
  "friki-videojuegos": {
    name: { es: "Videojuegos", en: "Video Games" },
    description: {
      es: "Metas competitivas, reseñas y mods.",
      en: "Competitive metas, reviews, and mods.",
    },
    example: {
      es: "Tier list definitiva de la temporada.",
      en: "Definitive tier list of the season.",
    },
    accentColor: "#7c3aed",
    tagline: {
      es: "GGs con argumentos.",
      en: "GGs with arguments.",
    },
    parentSlug: "friki",
  },
  "friki-anime": {
    name: { es: "Anime", en: "Anime" },
    description: {
      es: "Estrenos, teorías y frames favoritos.",
      en: "Premieres, theories, and favorite frames.",
    },
    example: {
      es: "Qué arco merece adaptación fiel.",
      en: "Which arc deserves a faithful adaptation?",
    },
    accentColor: "#d946ef",
    tagline: {
      es: "Explica tus feels panel por panel.",
      en: "Explain your feels panel by panel.",
    },
    parentSlug: "friki",
  },
  "friki-tecnologia": {
    name: { es: "Tecnología", en: "Technology" },
    description: {
      es: "Gadgets nuevos, IA, hardware y hacks caseros.",
      en: "New gadgets, AI, hardware, and homemade hacks.",
    },
    example: {
      es: "Setup minimalista con presupuesto real.",
      en: "Minimal setup on a real budget.",
    },
    accentColor: "#0ea5e9",
    tagline: {
      es: "Comparte tu build más reciente.",
      en: "Share your latest build.",
    },
    parentSlug: "friki",
  },
  "ideas-peliculas": {
    name: { es: "Películas", en: "Movies" },
    description: {
      es: "Análisis, easter eggs y recomendaciones raras.",
      en: "Analysis, easter eggs, and rare recommendations.",
    },
    example: {
      es: "Tres planos que redefinen un género.",
      en: "Three shots redefining a genre.",
    },
    accentColor: "#fb7185",
    tagline: {
      es: "Luces, cámara, opinión.",
      en: "Lights, camera, opinion.",
    },
    parentSlug: "ideas",
  },
  "ideas-libros": {
    name: { es: "Libros", en: "Books" },
    description: {
      es: "Club de lectura exprés con reseñas sinceras.",
      en: "Express book club with honest reviews.",
    },
    example: {
      es: "Qué capítulo cambió tu perspectiva.",
      en: "Which chapter shifted your perspective?",
    },
    accentColor: "#fde047",
    tagline: {
      es: "Lee, subraya y comparte.",
      en: "Read, highlight, and share.",
    },
    parentSlug: "ideas",
  },
  "ideas-musica": {
    name: { es: "Música", en: "Music" },
    description: {
      es: "Playlists, reseñas de discos y shows inolvidables.",
      en: "Playlists, album reviews, and unforgettable shows.",
    },
    example: {
      es: "Setlist soñado para tu banda favorita.",
      en: "Dream setlist for your favorite band.",
    },
    accentColor: "#fbbf24",
    tagline: {
      es: "Sube el volumen de la conversación.",
      en: "Turn up the volume on the conversation.",
    },
    parentSlug: "ideas",
  },
  "social-presentacion": {
    name: { es: "Presentación", en: "Introductions" },
    description: {
      es: "Cuenta quién eres y qué te apasiona.",
      en: "Share who you are and what you're into.",
    },
    example: {
      es: "Nuevo miembro buscando crew.",
      en: "New member looking for a crew.",
    },
    accentColor: "#38bdf8",
    tagline: {
      es: "Rompe el hielo con estilo.",
      en: "Break the ice with style.",
    },
    parentSlug: "social",
  },
  "social-buscar-duo": {
    name: { es: "Buscar dúo", en: "Looking for Duo" },
    description: {
      es: "Publica qué juego o proyecto necesita compañer@.",
      en: "Post which game or project needs a partner.",
    },
    example: {
      es: "Necesito co-host para stream experimental.",
      en: "Need a co-host for an experimental stream.",
    },
    accentColor: "#0ea5e9",
    tagline: {
      es: "Encuentra química en segundos.",
      en: "Find chemistry in seconds.",
    },
    parentSlug: "social",
  },
  "social-buscar-con-quien-jugar": {
    name: { es: "Buscar con quién jugar", en: "Looking for Squad" },
    description: {
      es: "Reúne equipo para ranked, casual o eventos.",
      en: "Assemble a team for ranked, casual, or events.",
    },
    example: {
      es: "Grupo chill para raids nocturnas.",
      en: "Chill group for late-night raids.",
    },
    accentColor: "#06b6d4",
    tagline: {
      es: "Postea, coordina, juega.",
      en: "Post, coordinate, play.",
    },
    parentSlug: "social",
  },
} as const satisfies Record<string, SectionDefinitionBase & { parentSlug: PrimarySectionSlug }>;

type SectionDefinition = SectionDefinitionBase & { parentSlug?: PrimarySectionSlug };

export const SECTION_DEFINITIONS = {
  ...PRIMARY_SECTION_DEFINITIONS,
  ...SECTION_TOPIC_DEFINITIONS,
} as const satisfies Record<string, SectionDefinition>;

export type SectionSlug = keyof typeof SECTION_DEFINITIONS;

export const PRIMARY_SECTION_SLUGS = Object.keys(PRIMARY_SECTION_DEFINITIONS) as PrimarySectionSlug[];
export const SECTION_SLUGS = Object.keys(SECTION_DEFINITIONS) as SectionSlug[];

const SECTION_PARENT_LOOKUP: Partial<Record<SectionSlug, PrimarySectionSlug>> = {};
for (const [slug, definition] of Object.entries(SECTION_TOPIC_DEFINITIONS)) {
  SECTION_PARENT_LOOKUP[slug as SectionSlug] = definition.parentSlug;
}

export const SECTION_TOPICS: Record<PrimarySectionSlug, SectionSlug[]> = PRIMARY_SECTION_SLUGS.reduce((acc, slug) => {
  acc[slug] = [];
  return acc;
}, {} as Record<PrimarySectionSlug, SectionSlug[]>);

for (const [slug, definition] of Object.entries(SECTION_TOPIC_DEFINITIONS)) {
  SECTION_TOPICS[definition.parentSlug].push(slug as SectionSlug);
}

export function getSectionTopics(slug: PrimarySectionSlug) {
  return SECTION_TOPICS[slug] ?? [];
}

export function getSectionParentSlug(slug: SectionSlug) {
  return SECTION_PARENT_LOOKUP[slug] ?? null;
}

export function isPrimarySectionSlug(slug: string): slug is PrimarySectionSlug {
  return (PRIMARY_SECTION_SLUGS as string[]).includes(slug);
}

export function getSectionCopy(slug: SectionSlug, locale: Locale) {
  const definition = SECTION_DEFINITIONS[slug];
  return {
    name: definition.name[locale],
    description: definition.description[locale],
    example: definition.example?.[locale],
    tagline: definition.tagline[locale],
    iconImage: "iconImage" in definition ? definition.iconImage : undefined,
  };
}
