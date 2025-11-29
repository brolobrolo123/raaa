import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/auth_store.dart';
import '../../../../core/feed_notifier.dart';
import '../../../../data/article_repository.dart';
import '../../../../data/section_repository.dart';
import '../../../../l10n/l10n.dart';
import '../../../../l10n/locale_controller.dart';
import '../../../../models/article.dart';
import '../../../../models/section.dart';
import '../../../articles/presentation/screens/article_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _sectionRepository = SectionRepository();
  final _articleRepository = ArticleRepository();
  final _feedNotifier = FeedNotifier.instance;
  final _localeController = LocaleController.instance;
  late Future<_HomeSnapshot> _future;

  @override
  void initState() {
    super.initState();
    _future = _loadHome();
    _feedNotifier.addListener(_handleFeedRefresh);
  }

  @override
  void dispose() {
    _feedNotifier.removeListener(_handleFeedRefresh);
    super.dispose();
  }

  void _reloadSections() {
    setState(() {
      _future = _loadHome();
    });
  }

  void _handleFeedRefresh() {
    if (!mounted) return;
    _reloadSections();
  }

  Future<_HomeSnapshot> _loadHome() async {
    final sections = await _sectionRepository.fetchSections();
    final recentArticles = await _articleRepository.fetchRecentArticles(limit: 3);
    return _HomeSnapshot(sections: sections, recentArticles: recentArticles);
  }

  void _openArticle(Article article) {
    if (article.id.isEmpty) return;
    context.pushNamed(
      ArticleDetailScreen.routeName,
      pathParameters: {'articleId': article.id},
      extra: article,
    );
  }

  Future<void> _showAccountSheet() async {
    final action = await showModalBottomSheet<_AccountAction>(
      context: context,
      useSafeArea: true,
      builder: (context) {
        return const _AccountActionSheet();
      },
    );
    if (!mounted || action == null) return;
    switch (action) {
      case _AccountAction.profile:
        context.go('/profile');
        break;
      case _AccountAction.logout:
        _logout();
        break;
      case _AccountAction.language:
        _showLanguageSheet();
        break;
    }
  }

  void _logout() {
    AuthStore.instance.clear();
    if (!mounted) return;
    context.go('/login');
  }

  Future<void> _showLanguageSheet() async {
    final selected = await showModalBottomSheet<Locale>(
      context: context,
      useSafeArea: true,
      builder: (context) => _LanguageSheet(currentLocale: _localeController.locale),
    );
    if (selected != null) {
      await _localeController.setLocale(selected);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          children: [
            _HeroHeader(
              onExplore: () => context.go('/sections'),
            ),
            const SizedBox(height: 32),
            _QuickActions(onAccountTap: _showAccountSheet),
            const SizedBox(height: 32),
            FutureBuilder<_HomeSnapshot>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const Center(
                      child: Padding(
                          padding: EdgeInsets.all(32),
                          child: CircularProgressIndicator()));
                }
                if (snapshot.hasError) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l10n.home.highlightsError),
                      const SizedBox(height: 12),
                      TextButton.icon(
                        onPressed: _reloadSections,
                        icon: const Icon(Icons.refresh),
                        label: Text(l10n.common.retry),
                      ),
                    ],
                  );
                }
                final data = snapshot.data;
                if (data == null) {
                  return const SizedBox.shrink();
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SectionHighlights(
                      sections: data.sections,
                      onArticleTap: _openArticle,
                    ),
                    const SizedBox(height: 32),
                    _RecentArticlesList(
                      articles: data.recentArticles,
                      onArticleTap: _openArticle,
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeSnapshot {
  const _HomeSnapshot({required this.sections, required this.recentArticles});

  final List<Section> sections;
  final List<Article> recentArticles;
}

class _HeroHeader extends StatelessWidget {
  const _HeroHeader({required this.onExplore});

  final VoidCallback onExplore;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(36),
        gradient: LinearGradient(
          colors: [
            Colors.deepPurpleAccent.withValues(alpha: 0.4),
            Colors.blueAccent.withValues(alpha: 0.3),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.home.heroTitle,
            style: theme.textTheme.displaySmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Text(
            l10n.home.heroSubtitle,
            style: theme.textTheme.bodyLarge
                ?.copyWith(color: Colors.white.withValues(alpha: 0.9), height: 1.4),
          ),
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: onExplore,
            icon: const Icon(Icons.auto_awesome),
            label: Text(l10n.home.heroCta),
          ),
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({required this.onAccountTap});

  final VoidCallback onAccountTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        _ActionChip(
          label: l10n.home.quickAccount,
          icon: Icons.person,
          onTap: onAccountTap,
        ),
      ],
    );
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip(
      {required this.label, required this.icon, required this.onTap});

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
          color: Colors.white.withValues(alpha: 0.04),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: Colors.white70),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _SectionHighlights extends StatelessWidget {
  const _SectionHighlights({required this.sections, required this.onArticleTap});

  final List<Section> sections;
  final ValueChanged<Article> onArticleTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;
    final data = sections.where((section) => section.articles.isNotEmpty).toList();
    if (data.isEmpty) {
      return Text(l10n.home.highlightsEmpty);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.home.highlightsTitle, style: theme.textTheme.headlineSmall),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            color: Colors.white.withValues(alpha: 0.03),
          ),
          child: Column(
            children: [
              for (var i = 0; i < data.length; i++) ...[
                _SectionHighlightRow(
                  section: data[i],
                  article: data[i].articles.first,
                  onTap: () => onArticleTap(data[i].articles.first),
                ),
                if (i < data.length - 1)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Divider(color: Colors.white.withValues(alpha: 0.1)),
                  ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _SectionHighlightRow extends StatelessWidget {
  const _SectionHighlightRow({
    required this.section,
    required this.article,
    required this.onTap,
  });

  final Section section;
  final Article article;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(section.name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        if (section.tagline.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(section.tagline, style: const TextStyle(color: Colors.white70)),
        ],
        const SizedBox(height: 10),
        Text(l10n.home.topTopicLabel,
          style: theme.textTheme.labelSmall?.copyWith(color: Colors.white70)),
        const SizedBox(height: 6),
        Text(article.title, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Text(
          article.summary,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: Colors.white70),
        ),
        const SizedBox(height: 8),
        Align(
          alignment: Alignment.centerLeft,
          child: FilledButton.tonalIcon(
            onPressed: onTap,
            icon: const Icon(Icons.open_in_new),
            label: Text(l10n.home.viewArticle),
          ),
        ),
      ],
    );
  }
}

class _RecentArticlesList extends StatelessWidget {
  const _RecentArticlesList({required this.articles, required this.onArticleTap});

  final List<Article> articles;
  final ValueChanged<Article> onArticleTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;
    if (articles.isEmpty) {
      return Text(l10n.home.recentEmpty);
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.home.recentTitle, style: theme.textTheme.headlineSmall),
        const SizedBox(height: 12),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: articles.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final article = articles[index];
            return _RecentArticleTile(
              article: article,
              onTap: () => onArticleTap(article),
            );
          },
        ),
      ],
    );
  }
}

class _RecentArticleTile extends StatelessWidget {
  const _RecentArticleTile({required this.article, required this.onTap});

  final Article article;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          color: Colors.white.withValues(alpha: 0.03),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(article.title,
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Text(
              article.summary,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white70, height: 1.3),
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _formatArticleDate(article.createdAt),
                  style: const TextStyle(fontSize: 12, color: Colors.white60),
                ),
                Icon(Icons.arrow_forward, color: Colors.white.withValues(alpha: 0.7)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

String _formatArticleDate(DateTime date) {
  final day = date.day.toString().padLeft(2, '0');
  final month = date.month.toString().padLeft(2, '0');
  final hour = date.hour.toString().padLeft(2, '0');
  final minute = date.minute.toString().padLeft(2, '0');
  return '$day/$month · $hour:$minute';
}

enum _AccountAction { profile, logout, language }

class _AccountActionSheet extends StatelessWidget {
  const _AccountActionSheet();

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l10n.home.accountSheetTitle, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => Navigator.of(context).pop(_AccountAction.profile),
            icon: const Icon(Icons.person_outline),
            label: Text(l10n.home.accountSheetProfile),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => Navigator.of(context).pop(_AccountAction.logout),
            icon: const Icon(Icons.logout),
            label: Text(l10n.home.accountSheetLogout),
          ),
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: () => Navigator.of(context).pop(_AccountAction.language),
            icon: const Icon(Icons.translate),
            label: Text(l10n.home.accountSheetLanguage),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _LanguageSheet extends StatelessWidget {
  const _LanguageSheet({required this.currentLocale});

  final Locale currentLocale;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final options = [
      _LanguageOption(code: 'es', label: l10n.account.spanish),
      _LanguageOption(code: 'en', label: l10n.account.english),
    ];

    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l10n.account.languageTitle, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 4),
          Text(l10n.account.languageSubtitle, style: const TextStyle(color: Colors.white70)),
          const SizedBox(height: 16),
          for (final option in options)
            RadioListTile<String>(
              value: option.code,
              groupValue: currentLocale.languageCode,
              onChanged: (value) {
                if (value == null) return;
                Navigator.of(context).pop(Locale(value));
              },
              title: Text(option.label),
            ),
        ],
      ),
    );
  }
}

class _LanguageOption {
  const _LanguageOption({required this.code, required this.label});

  final String code;
  final String label;
}
