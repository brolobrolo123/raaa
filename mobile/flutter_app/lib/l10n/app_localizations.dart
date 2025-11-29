import 'package:flutter/widgets.dart';

typedef _LookupFn = String Function(List<String> path, {Map<String, String>? params});

class AppLocalizations {
  AppLocalizations._(this.locale, this._dictionary);

  final Locale locale;
  final Map<String, dynamic> _dictionary;

  static const supportedLocales = [Locale('es'), Locale('en')];
  static const _fallbackLocale = Locale('es');

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  static Future<AppLocalizations> load(Locale locale) async {
    final code = supportedLocales.map((e) => e.languageCode).contains(locale.languageCode)
        ? locale.languageCode
        : _fallbackLocale.languageCode;
    final dictionary = _localizedValues[code] ?? _localizedValues[_fallbackLocale.languageCode]!;
    return AppLocalizations._(Locale(code), dictionary);
  }

  CommonStrings get common => CommonStrings(_lookup);
  AuthStrings get auth => AuthStrings(_lookup);
  HomeStrings get home => HomeStrings(_lookup);
  SectionsStrings get sections => SectionsStrings(_lookup);
  SectionDetailStrings get sectionDetail => SectionDetailStrings(_lookup);
  ArticleStrings get articles => ArticleStrings(_lookup);
  NotificationStrings get notifications => NotificationStrings(_lookup);
  ProfileStrings get profile => ProfileStrings(_lookup);
  ShellStrings get shell => ShellStrings(_lookup);
  AccountStrings get account => AccountStrings(_lookup);

  String _lookup(List<String> path, {Map<String, String>? params}) {
    final raw = _resolve(path, _dictionary) ??
        _resolve(path, _localizedValues[_fallbackLocale.languageCode]!) ??
        path.join('.');
    if (params == null || params.isEmpty) {
      return raw;
    }
    var resolved = raw;
    params.forEach((key, value) {
      resolved = resolved.replaceAll('{$key}', value);
    });
    return resolved;
  }

  static String? _resolve(List<String> path, Map<String, dynamic> source) {
    dynamic current = source;
    for (final segment in path) {
      if (current is Map<String, dynamic> && current.containsKey(segment)) {
        current = current[segment];
      } else {
        return null;
      }
    }
    return current is String ? current : null;
  }
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) =>
      AppLocalizations.supportedLocales.any((supported) => supported.languageCode == locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) => AppLocalizations.load(locale);

  @override
  bool shouldReload(covariant LocalizationsDelegate<AppLocalizations> old) => false;
}

class CommonStrings {
  const CommonStrings(this._lookup);

  final _LookupFn _lookup;

  String get appName => _lookup(['common', 'appName']);
  String get retry => _lookup(['common', 'retry']);
  String get loading => _lookup(['common', 'loading']);
  String get cancel => _lookup(['common', 'cancel']);
  String get close => _lookup(['common', 'close']);
  String get save => _lookup(['common', 'save']);
  String get errorGeneric => _lookup(['common', 'errorGeneric']);
  String get spanish => _lookup(['common', 'spanish']);
  String get english => _lookup(['common', 'english']);
  String get languageLabel => _lookup(['common', 'languageLabel']);
  String byAuthor(String author) =>
      _lookup(['common', 'byAuthor'], params: {'author': author});
}

class AuthStrings {
  const AuthStrings(this._lookup);

  final _LookupFn _lookup;

  LoginStrings get login => LoginStrings(_lookup);
  RegisterStrings get register => RegisterStrings(_lookup);
}

class LoginStrings {
  const LoginStrings(this._lookup);

  final _LookupFn _lookup;

  String get title => _lookup(['auth', 'login', 'title']);
  String get subtitle => _lookup(['auth', 'login', 'subtitle']);
  String get credentialLabel => _lookup(['auth', 'login', 'credentialLabel']);
  String get credentialHint => _lookup(['auth', 'login', 'credentialHint']);
  String get credentialRequired => _lookup(['auth', 'login', 'credentialRequired']);
  String get credentialTooShort => _lookup(['auth', 'login', 'credentialTooShort']);
  String get passwordLabel => _lookup(['auth', 'login', 'passwordLabel']);
  String get passwordHint => _lookup(['auth', 'login', 'passwordHint']);
  String get passwordTooShort => _lookup(['auth', 'login', 'passwordTooShort']);
  String get submit => _lookup(['auth', 'login', 'submit']);
  String get registerCta => _lookup(['auth', 'login', 'registerCta']);
  String get registerLink => _lookup(['auth', 'login', 'registerLink']);
}

class RegisterStrings {
  const RegisterStrings(this._lookup);

  final _LookupFn _lookup;

  String get title => _lookup(['auth', 'register', 'title']);
  String get subtitle => _lookup(['auth', 'register', 'subtitle']);
  String get usernameLabel => _lookup(['auth', 'register', 'usernameLabel']);
  String get usernameHint => _lookup(['auth', 'register', 'usernameHint']);
  String get usernameRequired => _lookup(['auth', 'register', 'usernameRequired']);
  String get usernameTooShort => _lookup(['auth', 'register', 'usernameTooShort']);
  String get emailLabel => _lookup(['auth', 'register', 'emailLabel']);
  String get emailHint => _lookup(['auth', 'register', 'emailHint']);
  String get emailRequired => _lookup(['auth', 'register', 'emailRequired']);
  String get emailInvalid => _lookup(['auth', 'register', 'emailInvalid']);
  String get passwordLabel => _lookup(['auth', 'register', 'passwordLabel']);
  String get passwordHint => _lookup(['auth', 'register', 'passwordHint']);
  String get passwordTooShort => _lookup(['auth', 'register', 'passwordTooShort']);
  String get submit => _lookup(['auth', 'register', 'submit']);
  String get loginCta => _lookup(['auth', 'register', 'loginCta']);
  String get loginLink => _lookup(['auth', 'register', 'loginLink']);
  String get success => _lookup(['auth', 'register', 'success']);
}

class HomeStrings {
  const HomeStrings(this._lookup);

  final _LookupFn _lookup;

  String get heroTitle => _lookup(['home', 'hero', 'title']);
  String get heroSubtitle => _lookup(['home', 'hero', 'subtitle']);
  String get heroCta => _lookup(['home', 'hero', 'cta']);
  String get quickAccount => _lookup(['home', 'quickActions', 'account']);
  String get highlightsTitle => _lookup(['home', 'highlights', 'title']);
  String get highlightsEmpty => _lookup(['home', 'highlights', 'empty']);
  String get highlightsError => _lookup(['home', 'highlights', 'error']);
  String get topTopicLabel => _lookup(['home', 'highlights', 'topTopic']);
  String get viewArticle => _lookup(['home', 'highlights', 'viewArticle']);
  String get recentTitle => _lookup(['home', 'recent', 'title']);
  String get recentEmpty => _lookup(['home', 'recent', 'empty']);
  String get accountSheetTitle => _lookup(['home', 'accountSheet', 'title']);
  String get accountSheetProfile => _lookup(['home', 'accountSheet', 'profile']);
  String get accountSheetLogout => _lookup(['home', 'accountSheet', 'logout']);
  String get accountSheetLanguage => _lookup(['home', 'accountSheet', 'language']);
}

class SectionsStrings {
  const SectionsStrings(this._lookup);

  final _LookupFn _lookup;

  String get title => _lookup(['sections', 'title']);
  String get subtitle => _lookup(['sections', 'subtitle']);
  String get loadError => _lookup(['sections', 'loadError']);
  String get retry => _lookup(['sections', 'retry']);
}

class SectionDetailStrings {
  const SectionDetailStrings(this._lookup);

  final _LookupFn _lookup;

  String get filterTop => _lookup(['sectionDetail', 'filters', 'top']);
  String get filterRecent => _lookup(['sectionDetail', 'filters', 'recent']);
  String get emptyTop => _lookup(['sectionDetail', 'empty', 'top']);
  String get emptyRecent => _lookup(['sectionDetail', 'empty', 'recent']);
  String get loadMore => _lookup(['sectionDetail', 'loadMore']);
  String get loadingMore => _lookup(['sectionDetail', 'loadingMore']);
  String commentBy(String author) =>
      _lookup(['sectionDetail', 'commentBy'], params: {'author': author});
  String get loadError => _lookup(['sectionDetail', 'loadError']);
  String get refreshError => _lookup(['sectionDetail', 'refreshError']);
  String get loadMoreError => _lookup(['sectionDetail', 'loadMoreError']);
}

class ArticleStrings {
  const ArticleStrings(this._lookup);

  final _LookupFn _lookup;

  CreateArticleStrings get create => CreateArticleStrings(_lookup);
}

class CreateArticleStrings {
  const CreateArticleStrings(this._lookup);

  final _LookupFn _lookup;

  String get title => _lookup(['articles', 'create', 'title']);
  String get sectionLabel => _lookup(['articles', 'create', 'sectionLabel']);
  String get sectionError => _lookup(['articles', 'create', 'sectionError']);
  String get formTitleLabel => _lookup(['articles', 'create', 'formTitleLabel']);
  String get formTitleShort => _lookup(['articles', 'create', 'formTitleShort']);
  String get formTitleLong => _lookup(['articles', 'create', 'formTitleLong']);
  String get formSummaryLabel => _lookup(['articles', 'create', 'formSummaryLabel']);
  String get formSummaryShort => _lookup(['articles', 'create', 'formSummaryShort']);
  String get formSummaryLong => _lookup(['articles', 'create', 'formSummaryLong']);
  String get contentLabel => _lookup(['articles', 'create', 'contentLabel']);
  String get contentPlaceholder => _lookup(['articles', 'create', 'contentPlaceholder']);
  String get contentError => _lookup(['articles', 'create', 'contentError']);
  String get coverLabel => _lookup(['articles', 'create', 'coverLabel']);
  String get noCoverSelected => _lookup(['articles', 'create', 'noCoverSelected']);
  String get removeCover => _lookup(['articles', 'create', 'removeCover']);
  String get insertImage => _lookup(['articles', 'create', 'insertImage']);
  String get invalidImage => _lookup(['articles', 'create', 'invalidImage']);
  String get submit => _lookup(['articles', 'create', 'submit']);
  String get submitting => _lookup(['articles', 'create', 'submitting']);
  String get success => _lookup(['articles', 'create', 'success']);
}

class NotificationStrings {
  const NotificationStrings(this._lookup);

  final _LookupFn _lookup;

  String get title => _lookup(['notifications', 'title']);
  String get loading => _lookup(['notifications', 'loading']);
  String get error => _lookup(['notifications', 'error']);
  String get emptyTitle => _lookup(['notifications', 'emptyTitle']);
  String get emptySubtitle => _lookup(['notifications', 'emptySubtitle']);
  String get unreadSingle => _lookup(['notifications', 'unreadSingle']);
  String unreadPlural(int count) =>
      _lookup(['notifications', 'unreadPlural'], params: {'count': '$count'});
  String get retry => _lookup(['notifications', 'retry']);
  String get fallbackArticleTitle => _lookup(['notifications', 'fallbackArticleTitle']);
  String fromActor(String actor) =>
      _lookup(['notifications', 'fromActor'], params: {'actor': actor});
}

class ProfileStrings {
  const ProfileStrings(this._lookup);

  final _LookupFn _lookup;

  String get title => _lookup(['profile', 'title']);
  String get syncing => _lookup(['profile', 'syncing']);
  String get loadError => _lookup(['profile', 'loadError']);
  String get statsArticles => _lookup(['profile', 'stats', 'articles']);
  String get statsComments => _lookup(['profile', 'stats', 'comments']);
  String get statsReactions => _lookup(['profile', 'stats', 'reactions']);
  String get bio => _lookup(['profile', 'bio']);
  String memberSince(String date) =>
      _lookup(['profile', 'memberSince'], params: {'date': date});
  String get publicationsEmptyTitle => _lookup(['profile', 'publications', 'emptyTitle']);
  String get publicationsEmptySubtitle => _lookup(['profile', 'publications', 'emptySubtitle']);
  String get publicationsTitle => _lookup(['profile', 'publications', 'title']);
  String get securityTitle => _lookup(['profile', 'security', 'title']);
  String get securityDescription => _lookup(['profile', 'security', 'description']);
  String get securityCta => _lookup(['profile', 'security', 'cta']);
  String get passwordSheetTitle => _lookup(['profile', 'passwordSheet', 'title']);
  String get currentPasswordLabel => _lookup(['profile', 'passwordSheet', 'currentPasswordLabel']);
  String get currentPasswordError => _lookup(['profile', 'passwordSheet', 'currentPasswordError']);
  String get newPasswordLabel => _lookup(['profile', 'passwordSheet', 'newPasswordLabel']);
  String get newPasswordHelper => _lookup(['profile', 'passwordSheet', 'newPasswordHelper']);
  String get newPasswordError => _lookup(['profile', 'passwordSheet', 'newPasswordError']);
  String get newPasswordMatchError => _lookup(['profile', 'passwordSheet', 'newPasswordMatchError']);
  String get savePassword => _lookup(['profile', 'passwordSheet', 'save']);
  String get passwordUpdated => _lookup(['profile', 'passwordUpdated']);
}

class ShellStrings {
  const ShellStrings(this._lookup);

  final _LookupFn _lookup;

  String get navHome => _lookup(['shell', 'nav', 'home']);
  String get navNotifications => _lookup(['shell', 'nav', 'notifications']);
  String get navSections => _lookup(['shell', 'nav', 'sections']);
  String get newArticle => _lookup(['shell', 'newArticle']);
}

class AccountStrings {
  const AccountStrings(this._lookup);

  final _LookupFn _lookup;

  String get languageTitle => _lookup(['account', 'language', 'title']);
  String get languageSubtitle => _lookup(['account', 'language', 'subtitle']);
  String get chooseLanguage => _lookup(['account', 'language', 'choose']);
  String get spanish => _lookup(['account', 'language', 'spanish']);
  String get english => _lookup(['account', 'language', 'english']);
}

const Map<String, Map<String, dynamic>> _localizedValues = {
  'es': {
    'common': {
      'appName': 'Teoría Forum',
      'retry': 'Reintentar',
      'loading': 'Cargando…',
      'cancel': 'Cancelar',
      'close': 'Cerrar',
      'save': 'Guardar',
      'errorGeneric': 'Ocurrió un error. Inténtalo más tarde.',
      'spanish': 'Español',
      'english': 'English',
      'languageLabel': 'Idioma',
      'byAuthor': 'por {author}',
    },
    'auth': {
      'login': {
        'title': 'Bienvenido de nuevo',
        'subtitle': 'Ingresa para continuar investigando teorías con la comunidad.',
        'credentialLabel': 'Usuario o correo',
        'credentialHint': 'Ingresa tu usuario o correo',
        'credentialRequired': 'Ingresa tu usuario o correo',
        'credentialTooShort': 'Debe tener al menos 3 caracteres',
        'passwordLabel': 'Contraseña',
        'passwordHint': 'Mínimo 6 caracteres',
        'passwordTooShort': 'Mínimo 6 caracteres',
        'submit': 'Iniciar sesión',
        'registerCta': '¿No tienes cuenta?',
        'registerLink': 'Regístrate',
      },
      'register': {
        'title': 'Únete a la comunidad',
        'subtitle': 'Crea una cuenta para publicar teorías y votar descubrimientos.',
        'usernameLabel': 'Nombre de usuario',
        'usernameHint': 'Ingresa tu usuario',
        'usernameRequired': 'Ingresa tu usuario',
        'usernameTooShort': 'Debe tener al menos 3 caracteres',
        'emailLabel': 'Correo electrónico',
        'emailHint': 'Ingresa tu correo',
        'emailRequired': 'Ingresa tu correo',
        'emailInvalid': 'Formato inválido',
        'passwordLabel': 'Contraseña',
        'passwordHint': 'Mínimo 6 caracteres',
        'passwordTooShort': 'Mínimo 6 caracteres',
        'submit': 'Crear cuenta',
        'loginCta': '¿Ya tienes cuenta?',
        'loginLink': 'Inicia sesión',
        'success': 'Cuenta creada. Inicia sesión para continuar.',
      },
    },
    'home': {
      'hero': {
        'title': 'Elige una sección',
        'subtitle': 'Lee ideas, comenta y publica las tuyas. Siempre encontrarás algo interesante que leer.',
        'cta': 'Explorar secciones',
      },
      'quickActions': {
        'account': 'Cuenta',
      },
      'highlights': {
        'title': 'Más votados',
        'empty': 'Aún no hay teorías destacadas en las secciones principales.',
        'error': 'No pudimos cargar las secciones destacadas.',
        'topTopic': 'Tema más votado',
        'viewArticle': 'Ver teoría',
      },
      'recent': {
        'title': 'Artículos recientes',
        'empty': 'Todavía no hay artículos recientes.',
      },
      'accountSheet': {
        'title': 'Cuenta',
        'profile': 'Mi perfil',
        'logout': 'Cerrar sesión',
        'language': 'Cambiar idioma',
      },
    },
    'sections': {
      'title': 'Elige una sección',
      'subtitle': 'Explora teorías activas, filtra por vibración y comparte tu propia investigación desde el móvil.',
      'loadError': 'No pudimos cargar las secciones. Intenta nuevamente.',
      'retry': 'Reintentar',
    },
    'sectionDetail': {
      'filters': {
        'top': 'Más votados',
        'recent': 'Recientes',
      },
      'empty': {
        'top': 'No hay teorías destacadas todavía.',
        'recent': 'No tenemos actividad reciente aún.',
      },
      'loadMore': 'Ver más recientes',
      'loadingMore': 'Cargando…',
      'commentBy': '💬 {author} respondió',
      'loadError': 'No pudimos cargar la sección.',
      'refreshError': 'No pudimos actualizar la sección.',
      'loadMoreError': 'No pudimos cargar más artículos',
    },
    'articles': {
      'create': {
        'title': 'Nueva teoría',
        'sectionLabel': 'Sección',
        'sectionError': 'Elige una sección',
        'formTitleLabel': 'Título',
        'formTitleShort': 'Usa entre 6 y 12 caracteres',
        'formTitleLong': 'Usa máximo 12 caracteres',
        'formSummaryLabel': 'Resumen',
        'formSummaryShort': 'Describe tu idea con al menos 12 caracteres',
        'formSummaryLong': 'Usa máximo 30 caracteres',
        'contentLabel': 'Contenido',
        'contentPlaceholder': 'Comparte evidencias, enlaces e imágenes para sustentar tu teoría...',
        'contentError': 'Explica tu teoría con al menos 100 caracteres',
        'coverLabel': 'Color de portada',
        'noCoverSelected': 'Sin color seleccionado',
        'removeCover': 'Quitar color',
        'insertImage': 'Insertar imagen desde galería',
        'invalidImage': 'Selecciona una imagen válida',
        'submit': 'Publicar teoría',
        'submitting': 'Publicando…',
        'success': 'Teoría publicada exitosamente',
      },
    },
    'notifications': {
      'title': 'Notificaciones',
      'loading': 'Cargando notificaciones…',
      'error': 'No pudimos sincronizar tus notificaciones.',
      'emptyTitle': 'Nada nuevo aún',
      'emptySubtitle': 'Aquí verás comentarios, respuestas y aplausos que recibas.',
      'unreadSingle': 'Tienes una notificación sin leer',
      'unreadPlural': 'Tienes {count} notificaciones sin leer',
      'retry': 'Reintentar',
      'fallbackArticleTitle': 'Teoría',
      'fromActor': 'De {actor}',
    },
    'profile': {
      'title': 'Mi perfil',
      'syncing': 'Sincronizando perfil…',
      'loadError': 'No pudimos cargar tu información.',
      'stats': {
        'articles': 'Artículos',
        'comments': 'Comentarios',
        'reactions': 'Reacciones',
      },
      'bio': 'Bio',
      'memberSince': 'Miembro desde {date}',
      'publications': {
        'emptyTitle': 'Tus publicaciones',
        'emptySubtitle': 'Cuando publiques nuevas teorías aparecerán aquí.',
        'title': 'Tus publicaciones recientes',
      },
      'security': {
        'title': 'Seguridad',
        'description': 'Actualiza tu contraseña desde el móvil para mantener tu cuenta protegida.',
        'cta': 'Cambiar contraseña',
      },
      'passwordSheet': {
        'title': 'Actualizar contraseña',
        'currentPasswordLabel': 'Contraseña actual',
        'currentPasswordError': 'Ingresa tu contraseña actual',
        'newPasswordLabel': 'Nueva contraseña',
        'newPasswordHelper': 'Debe tener al menos 8 caracteres',
        'newPasswordError': 'La nueva contraseña debe tener 8 caracteres',
        'newPasswordMatchError': 'Debe ser diferente a la actual',
        'save': 'Guardar nueva contraseña',
      },
      'passwordUpdated': 'Contraseña actualizada',
    },
    'shell': {
      'nav': {
        'home': 'Inicio',
        'notifications': 'Notificaciones',
        'sections': 'Secciones',
      },
      'newArticle': 'Nueva teoría',
    },
    'account': {
      'language': {
        'title': 'Idioma',
        'subtitle': 'Elige cómo ver la app',
        'choose': 'Selecciona un idioma',
        'spanish': 'Ver en español',
        'english': 'View in English',
      },
    },
  },
  'en': {
    'common': {
      'appName': 'Teoría Forum',
      'retry': 'Retry',
      'loading': 'Loading…',
      'cancel': 'Cancel',
      'close': 'Close',
      'save': 'Save',
      'errorGeneric': 'Something went wrong. Please try again later.',
      'spanish': 'Spanish',
      'english': 'English',
      'languageLabel': 'Language',
      'byAuthor': 'by {author}',
    },
    'auth': {
      'login': {
        'title': 'Welcome back',
        'subtitle': 'Sign in to keep investigating theories with the community.',
        'credentialLabel': 'Username or email',
        'credentialHint': 'Enter your username or email',
        'credentialRequired': 'Enter your username or email',
        'credentialTooShort': 'Must be at least 3 characters',
        'passwordLabel': 'Password',
        'passwordHint': 'At least 6 characters',
        'passwordTooShort': 'At least 6 characters',
        'submit': 'Sign in',
        'registerCta': "Don't have an account?",
        'registerLink': 'Create one',
      },
      'register': {
        'title': 'Join the community',
        'subtitle': 'Create an account to publish theories and vote on discoveries.',
        'usernameLabel': 'Username',
        'usernameHint': 'Enter your username',
        'usernameRequired': 'Enter your username',
        'usernameTooShort': 'Must be at least 3 characters',
        'emailLabel': 'Email',
        'emailHint': 'Enter your email',
        'emailRequired': 'Enter your email',
        'emailInvalid': 'Invalid email format',
        'passwordLabel': 'Password',
        'passwordHint': 'At least 6 characters',
        'passwordTooShort': 'At least 6 characters',
        'submit': 'Create account',
        'loginCta': 'Already have an account?',
        'loginLink': 'Sign in',
        'success': 'Account created. Sign in to continue.',
      },
    },
    'home': {
      'hero': {
        'title': 'Choose a section',
        'subtitle': 'Read ideas, comment, and publish your own. There is always something worth reading.',
        'cta': 'Browse sections',
      },
      'quickActions': {
        'account': 'Account',
      },
      'highlights': {
        'title': 'Top voted',
        'empty': 'No featured theories yet in the main sections.',
        'error': "We couldn't load the featured sections.",
        'topTopic': 'Top topic',
        'viewArticle': 'Open theory',
      },
      'recent': {
        'title': 'Recent articles',
        'empty': 'No recent articles yet.',
      },
      'accountSheet': {
        'title': 'Account',
        'profile': 'My profile',
        'logout': 'Sign out',
        'language': 'Change language',
      },
    },
    'sections': {
      'title': 'Choose a section',
      'subtitle': 'Explore active theories, filter by vibe, and share your own research on mobile.',
      'loadError': "We couldn't load the sections. Try again.",
      'retry': 'Retry',
    },
    'sectionDetail': {
      'filters': {
        'top': 'Top voted',
        'recent': 'Recent',
      },
      'empty': {
        'top': 'No featured theories yet.',
        'recent': 'No recent activity yet.',
      },
      'loadMore': 'Load more recent',
      'loadingMore': 'Loading…',
      'commentBy': '💬 {author} replied',
      'loadError': 'We could not load the section.',
      'refreshError': 'We could not refresh the section.',
      'loadMoreError': 'We could not load more articles',
    },
    'articles': {
      'create': {
        'title': 'New theory',
        'sectionLabel': 'Section',
        'sectionError': 'Choose a section',
        'formTitleLabel': 'Title',
        'formTitleShort': 'Use between 6 and 12 characters',
        'formTitleLong': 'Use at most 12 characters',
        'formSummaryLabel': 'Summary',
        'formSummaryShort': 'Describe your idea with at least 12 characters',
        'formSummaryLong': 'Use at most 30 characters',
        'contentLabel': 'Content',
        'contentPlaceholder': 'Share evidence, links, and images to support your theory...',
        'contentError': 'Explain your theory with at least 100 characters',
        'coverLabel': 'Cover color',
        'noCoverSelected': 'No color selected',
        'removeCover': 'Remove color',
        'insertImage': 'Insert image from gallery',
        'invalidImage': 'Select a valid image',
        'submit': 'Publish theory',
        'submitting': 'Publishing…',
        'success': 'Theory published successfully',
      },
    },
    'notifications': {
      'title': 'Notifications',
      'loading': 'Loading notifications…',
      'error': "We couldn't sync your notifications.",
      'emptyTitle': 'Nothing new yet',
      'emptySubtitle': 'Comments, replies, and claps you receive will appear here.',
      'unreadSingle': 'You have one unread notification',
      'unreadPlural': 'You have {count} unread notifications',
      'retry': 'Retry',
      'fallbackArticleTitle': 'Theory',
      'fromActor': 'From {actor}',
    },
    'profile': {
      'title': 'My profile',
      'syncing': 'Syncing profile…',
      'loadError': "We couldn't load your information.",
      'stats': {
        'articles': 'Articles',
        'comments': 'Comments',
        'reactions': 'Reactions',
      },
      'bio': 'Bio',
      'memberSince': 'Member since {date}',
      'publications': {
        'emptyTitle': 'Your publications',
        'emptySubtitle': 'When you publish new theories they will show up here.',
        'title': 'Your recent publications',
      },
      'security': {
        'title': 'Security',
        'description': 'Update your password on mobile to keep your account safe.',
        'cta': 'Change password',
      },
      'passwordSheet': {
        'title': 'Update password',
        'currentPasswordLabel': 'Current password',
        'currentPasswordError': 'Enter your current password',
        'newPasswordLabel': 'New password',
        'newPasswordHelper': 'Must be at least 8 characters',
        'newPasswordError': 'The new password must be 8 characters long',
        'newPasswordMatchError': 'It must be different from the current one',
        'save': 'Save new password',
      },
      'passwordUpdated': 'Password updated',
    },
    'shell': {
      'nav': {
        'home': 'Home',
        'notifications': 'Notifications',
        'sections': 'Sections',
      },
      'newArticle': 'New theory',
    },
    'account': {
      'language': {
        'title': 'Language',
        'subtitle': 'Choose how the app looks',
        'choose': 'Pick a language',
        'spanish': 'View in Spanish',
        'english': 'View in English',
      },
    },
  },
};
