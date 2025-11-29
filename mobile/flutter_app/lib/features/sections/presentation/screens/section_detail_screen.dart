import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../data/section_repository.dart';
import '../../../../l10n/l10n.dart';
import '../../../../models/article.dart';
import '../../../../models/section.dart';
import '../../../../models/section_snapshot.dart';
import '../../../articles/presentation/screens/article_detail_screen.dart';

class SectionDetailScreen extends StatefulWidget {
  const SectionDetailScreen({super.key, required this.section});

  static const routeName = '/section';

  final Section section;

  @override
  State<SectionDetailScreen> createState() => _SectionDetailScreenState();
}

class _SectionDetailScreenState extends State<SectionDetailScreen> {
  final _repository = SectionRepository();
  SectionFilter _filter = SectionFilter.top;
  SectionSnapshot? _snapshot;
  List<Article> _recentFeed = const <Article>[];
  bool _isLoading = true;
  bool _isRefreshing = false;
  bool _isLoadingMore = false;
  bool _hasMoreRecent = false;
  int _recentPage = 1;
  String? _error;

  Section get _section => _snapshot?.section ?? widget.section;

  @override
  void initState() {
    super.initState();
    _loadSnapshot();
  }

  Future<void> _loadSnapshot() async {
    setState(() {
      _isLoading = _snapshot == null;
      _isRefreshing = _snapshot != null;
      _error = null;
    });

    try {
      final snapshot =
          await _repository.fetchSectionSnapshot(widget.section.slug);
      if (!mounted) return;
      setState(() {
        _snapshot = snapshot;
        _recentFeed = snapshot.recentArticles;
        _hasMoreRecent = snapshot.hasMoreRecent;
        _recentPage = 1;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString();
      });
      if (_snapshot != null) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
              SnackBar(content: Text(context.l10n.sectionDetail.refreshError)));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isRefreshing = false;
        });
      }
    }
  }

  void _changeFilter(SectionFilter filter) {
    if (_filter == filter) return;
    setState(() => _filter = filter);
    if (filter == SectionFilter.recent && _recentFeed.isEmpty) {
      _loadSnapshot();
    }
  }

  void _openArticle(Article article) {
    if (article.id.isEmpty) return;
    context.pushNamed(
      ArticleDetailScreen.routeName,
      pathParameters: {'articleId': article.id},
      extra: article,
    );
  }

  Future<void> _loadMoreRecent() async {
    if (_isLoadingMore || !_hasMoreRecent) {
      return;
    }

    setState(() => _isLoadingMore = true);
    final nextPage = _recentPage + 1;

    try {
      final snapshot = await _repository.fetchSectionSnapshot(
        widget.section.slug,
        view: SectionSnapshotView.recent,
        page: nextPage,
      );
      if (!mounted) return;
      setState(() {
        _recentPage = nextPage;
        _recentFeed = [..._recentFeed, ...snapshot.recentArticles];
        _hasMoreRecent = snapshot.hasMoreRecent;
      });
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
      ..showSnackBar(
          SnackBar(content: Text(context.l10n.sectionDetail.loadMoreError)));
    } finally {
      if (mounted) {
        setState(() => _isLoadingMore = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final snapshot = _snapshot;
    final List<Article> articles = _filter == SectionFilter.top
        ? (snapshot?.topArticles ?? const <Article>[])
        : _recentFeed;

    return Scaffold(
      appBar: AppBar(
        title: Text(_section.name),
      ),
      body: SafeArea(
        child: _buildContent(context, snapshot, articles),
      ),
    );
  }

  Widget _buildContent(
      BuildContext context, SectionSnapshot? snapshot, List<Article> articles) {
    final l10n = context.l10n;
    if (_isLoading && snapshot == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null && snapshot == null) {
      return _ErrorState(
        message: _error ?? l10n.sectionDetail.loadError,
        onRetry: _loadSnapshot,
      );
    }

    return RefreshIndicator(
      onRefresh: _loadSnapshot,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        children: [
          Text(
            _section.description,
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 24),
          _FilterPills(
            active: _filter,
            onChanged: _changeFilter,
            isLoading: _isRefreshing,
            topLabel: l10n.sectionDetail.filterTop,
            recentLabel: l10n.sectionDetail.filterRecent,
          ),
          const SizedBox(height: 24),
          if (_filter == SectionFilter.top &&
              (snapshot?.topArticles.isEmpty ?? true))
            _EmptyState(message: l10n.sectionDetail.emptyTop),
          if (_filter == SectionFilter.recent && articles.isEmpty)
            _EmptyState(message: l10n.sectionDetail.emptyRecent),
          ...articles.map(
            (article) => _ArticleTile(
              article: article,
              onTap: () => _openArticle(article),
            ),
          ),
          if (_filter == SectionFilter.recent && _hasMoreRecent)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: OutlinedButton.icon(
                onPressed: _isLoadingMore ? null : _loadMoreRecent,
                icon: _isLoadingMore
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.keyboard_arrow_down),
                label: Text(_isLoadingMore
                  ? l10n.sectionDetail.loadingMore
                  : l10n.sectionDetail.loadMore),
              ),
            ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _FilterPills extends StatelessWidget {
  const _FilterPills(
      {required this.active,
      required this.onChanged,
      required this.topLabel,
      required this.recentLabel,
      this.isLoading = false});

  final SectionFilter active;
  final ValueChanged<SectionFilter> onChanged;
  final String topLabel;
  final String recentLabel;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _FilterChip(
          label: topLabel,
          selected: active == SectionFilter.top,
          onTap: () => onChanged(SectionFilter.top),
        ),
        const SizedBox(width: 12),
        _FilterChip(
          label: recentLabel,
          selected: active == SectionFilter.recent,
          onTap: () => onChanged(SectionFilter.recent),
        ),
        if (isLoading) ...[
          const SizedBox(width: 12),
          const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2)),
        ],
      ],
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip(
      {required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: Colors.white24),
          color: selected
              ? Colors.white.withValues(alpha: 0.15)
              : Colors.white.withValues(alpha: 0.05),
        ),
        child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
      ),
    );
  }
}

class _ArticleTile extends StatelessWidget {
  const _ArticleTile({required this.article, required this.onTap});

  final Article article;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(28),
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            color: Colors.white.withValues(alpha: 0.04),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(article.title,
                  style: theme.textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Row(
                children: [
                  if (article.author != null && article.author!.isNotEmpty) ...[
                    Text(l10n.common.byAuthor(article.author!),
                        style:
                            const TextStyle(fontSize: 12, color: Colors.white70)),
                    const SizedBox(width: 12),
                  ],
                  Text(
                    _formatTimestamp(article.createdAt),
                    style: const TextStyle(fontSize: 12, color: Colors.white54),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                article.summary,
                style:
                    theme.textTheme.bodyMedium?.copyWith(color: Colors.white70),
              ),
              const SizedBox(height: 12),
              if (article.topComment != null) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    color: Colors.white.withValues(alpha: 0.03),
                    border:
                        Border.all(color: Colors.white.withValues(alpha: 0.06)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.sectionDetail.commentBy(article.topComment!.author),
                        style:
                            const TextStyle(fontSize: 12, color: Colors.white70),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        article.topComment!.body,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],
              Row(
                children: [
                  Text('⬆ ${article.score}',
                      style:
                          const TextStyle(fontSize: 12, color: Colors.white60)),
                  const SizedBox(width: 12),
                  Text('💬 ${article.comments}',
                      style:
                          const TextStyle(fontSize: 12, color: Colors.white60)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          FilledButton(onPressed: onRetry, child: Text(context.l10n.common.retry)),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        color: Colors.white.withValues(alpha: 0.02),
      ),
      child: Center(
        child: Text(message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white70)),
      ),
    );
  }
}

String _formatTimestamp(DateTime date) {
  final day = date.day.toString().padLeft(2, '0');
  final month = date.month.toString().padLeft(2, '0');
  final hour = date.hour.toString().padLeft(2, '0');
  final minute = date.minute.toString().padLeft(2, '0');
  return '$day/$month · $hour:$minute';
}
