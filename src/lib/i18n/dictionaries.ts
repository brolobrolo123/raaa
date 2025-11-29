export type Locale = "es" | "en";

type NestedDictionary = {
  [key: string]: string | NestedDictionary;
};

export const translations: Record<Locale, NestedDictionary> = {
  es: {
    common: {
      homeLabel: "Inicio",
      createArticle: "Crear artículo",
      publishArticle: "Publicar teoría",
      sectionLabel: "Sección",
      featuredArticle: "Artículo destacado",
      noVotesYet: "Aún no hay artículos con votos.",
      noRecentPosts: "Aún no hay publicaciones recientes.",
      votes: "votos",
      comments: "comentarios",
      filter: "Filtro",
      mostVoted: "Más votados",
      recent: "Recientes",
      page: "Página",
      previousPage: "Página anterior",
      nextPage: "Página siguiente",
      memberSince: "Miembro desde",
      profile: "Perfil",
      personalPanel: "Panel personal",
      notifications: "Notificaciones",
      articles: "Artículos",
      commentsLabel: "Comentarios",
      savedChanges: "Cambios guardados",
      loading: "Cargando...",
    },
    footer: {
      tagline: "Foro colaborativo para nuevas teorías y cronistas curiosos.",
      language: {
        label: "Idioma",
        switchToEnglish: "Ver en inglés",
        switchToSpanish: "Ver en español",
      },
    },
    hub: {
      title: "Elige una sección",
      description: "Descubre qué teoría está calentita y lánzate a leerla o a publicar la tuya.",
      exploreLabel: "Explora todas las secciones",
      topLabel: "Top 4",
      emptyTopSlot: "Sin artículo destacado.",
    },
    home: {
      headline: "Comparte tus ideas y debate la de otros.",
    },
    sectionsPage: {
      watchCountSuffix: "en vigilancia",
      moreAvailable: "· hay más",
      noRecentRecords: "Aún no hay registros recientes aquí.",
      noComments: "Aún no hay comentarios votados.",
    },
    profilePage: {
      recentArticlesTitle: "Tus artículos recientes",
      newArticleCta: "+ Nuevo artículo",
      noArticles: "Aún no has publicado artículos.",
      securityLabel: "Seguridad",
      securityTitle: "Actualiza tu contraseña",
      securityDescription: "Define una clave distinta a la actual y confirma el cambio.",
    },
    newArticlePage: {
      title: "Comparte tu pensamiento",
      subtitle: "Construye una hipótesis sólida, cita tus hallazgos y deja que la comunidad la ponga a prueba.",
    },
    notifications: {
      ariaLabel: "Notificaciones",
      title: "Notificaciones",
      upToDate: "Al día",
      unreadTemplate: "{count} sin leer",
      empty: "Aún no hay actividad.",
      viewArticle: "Ver artículo",
    },
    accountMenu: {
      ariaLabel: "Menú de cuenta",
      fallbackLabel: "Cuenta",
      profile: "Perfil",
      signOut: "Cerrar sesión",
      avatarAlt: "Avatar",
      avatarAltNamed: "Avatar de {name}",
    },
  },
  en: {
    common: {
      homeLabel: "Home",
      createArticle: "Create article",
      publishArticle: "Publish theory",
      sectionLabel: "Section",
      featuredArticle: "Featured article",
      noVotesYet: "No articles have votes yet.",
      noRecentPosts: "No recent posts yet.",
      votes: "votes",
      comments: "comments",
      filter: "Filter",
      mostVoted: "Most voted",
      recent: "Recent",
      page: "Page",
      previousPage: "Previous page",
      nextPage: "Next page",
      memberSince: "Member since",
      profile: "Profile",
      personalPanel: "Personal dashboard",
      notifications: "Notifications",
      articles: "Articles",
      commentsLabel: "Comments",
      savedChanges: "Changes saved",
      loading: "Loading...",
    },
    footer: {
      tagline: "Collaborative forum for fresh theories and curious chroniclers.",
      language: {
        label: "Language",
        switchToEnglish: "View in English",
        switchToSpanish: "Ver en español",
      },
    },
    hub: {
      title: "Choose a section",
      description: "See which theory is buzzing and jump in to read or publish your own.",
      exploreLabel: "Browse every section",
      topLabel: "Top 4",
      emptyTopSlot: "No featured article yet.",
    },
    home: {
      headline: "Share your ideas and debate others.",
    },
    sectionsPage: {
      watchCountSuffix: "under watch",
      moreAvailable: "· more available",
      noRecentRecords: "No recent records yet.",
      noComments: "No comments have votes yet.",
    },
    profilePage: {
      recentArticlesTitle: "Your recent articles",
      newArticleCta: "+ New article",
      noArticles: "You haven't published any articles yet.",
      securityLabel: "Security",
      securityTitle: "Update your password",
      securityDescription: "Set a different password and confirm the change.",
    },
    newArticlePage: {
      title: "Share your theory",
      subtitle: "Build a solid hypothesis, cite your findings, and let the community put it to the test.",
    },
    notifications: {
      ariaLabel: "Notifications",
      title: "Notifications",
      upToDate: "Up to date",
      unreadTemplate: "{count} unread",
      empty: "No activity yet.",
      viewArticle: "View article",
    },
    accountMenu: {
      ariaLabel: "Account menu",
      fallbackLabel: "Account",
      profile: "Profile",
      signOut: "Sign out",
      avatarAlt: "Avatar",
      avatarAltNamed: "Avatar of {name}",
    },
  },
} as const;

export type Dictionary = (typeof translations)[Locale];

export function translate(dictionary: Dictionary, path: string): string {
  const segments = path.split(".");
  let current: unknown = dictionary;
  for (const segment of segments) {
    if (typeof current !== "object" || current === null) {
      return path;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" ? current : path;
}
