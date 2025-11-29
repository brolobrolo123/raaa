import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_quill/flutter_quill.dart' show FlutterQuillLocalizations;
import 'package:go_router/go_router.dart';

import 'features/articles/presentation/screens/article_detail_screen.dart';
import 'features/articles/presentation/screens/create_article_screen.dart';
import 'features/auth/presentation/screens/login_screen.dart';
import 'features/auth/presentation/screens/register_screen.dart';
import 'features/home/presentation/screens/home_screen.dart';
import 'features/notifications/presentation/screens/notifications_screen.dart';
import 'features/profile/presentation/screens/profile_screen.dart';
import 'features/sections/presentation/screens/section_detail_screen.dart';
import 'features/sections/presentation/screens/sections_screen.dart';
import 'features/shell/presentation/app_shell.dart';
import 'l10n/app_localizations.dart';
import 'l10n/locale_controller.dart';
import 'models/article.dart';
import 'models/section.dart';
import 'theme/app_theme.dart';

class DysonForumApp extends StatefulWidget {
  const DysonForumApp({super.key, required this.localeController});

  final LocaleController localeController;

  @override
  State<DysonForumApp> createState() => _DysonForumAppState();
}

class _DysonForumAppState extends State<DysonForumApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = _createRouter();
  }

  GoRouter _createRouter() {
    return GoRouter(
      initialLocation: '/login',
      routes: [
        GoRoute(
          path: '/login',
          name: 'login',
          builder: (_, __) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          name: 'register',
          builder: (_, __) => const RegisterScreen(),
        ),
        GoRoute(
          path: SectionDetailScreen.routeName,
          name: SectionDetailScreen.routeName,
          builder: (context, state) {
            final section = state.extra as Section;
            return SectionDetailScreen(section: section);
          },
        ),
        GoRoute(
          path: '/profile',
          name: 'profile',
          builder: (_, __) => const ProfileScreen(),
        ),
        GoRoute(
          path: '/articles/create',
          name: 'create-article',
          builder: (_, __) => const CreateArticleScreen(),
        ),
        GoRoute(
          path: '/articles/:articleId',
          name: ArticleDetailScreen.routeName,
          builder: (_, state) {
            final articleId = state.pathParameters['articleId'] ?? '';
            final preview = state.extra is Article ? state.extra as Article : null;
            return ArticleDetailScreen(articleId: articleId, initialPreview: preview);
          },
        ),
        StatefulShellRoute.indexedStack(
          builder: (_, __, navigationShell) => AppShell(shell: navigationShell),
          branches: [
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/home',
                  name: 'home',
                  builder: (_, __) => const HomeScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/notifications',
                  name: 'notifications',
                  builder: (_, __) => const NotificationsScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/sections',
                  name: 'sections',
                  builder: (_, __) => const SectionsScreen(),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.localeController,
      builder: (context, _) {
        return MaterialApp.router(
          title: 'Teoría Forum',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.build(),
          locale: widget.localeController.locale,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
            FlutterQuillLocalizations.delegate,
          ],
          supportedLocales: AppLocalizations.supportedLocales,
          routerConfig: _router,
        );
      },
    );
  }
}
