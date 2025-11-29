import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../data/notification_repository.dart';
import '../../../../l10n/l10n.dart';
import '../../../../models/article.dart';
import '../../../../models/app_notification.dart';
import '../../../articles/presentation/screens/article_detail_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _repository = NotificationRepository();
  late Future<NotificationFeed> _future;

  @override
  void initState() {
    super.initState();
    _future = _repository.fetchNotifications();
  }

  Future<void> _refresh() async {
    setState(() {
      _future = _repository.fetchNotifications();
    });
    try {
      await _future;
    } catch (_) {
      // errors handled by FutureBuilder UI
    }
  }

  void _openNotification(AppNotification notification) {
    final articleId = notification.articleId;
    if (articleId == null || articleId.isEmpty) {
      return;
    }
    final preview = Article(
      id: articleId,
      title: notification.articleTitle ?? context.l10n.notifications.fallbackArticleTitle,
      summary: notification.message,
      score: 0,
      comments: 0,
      createdAt: notification.createdAt,
      author: notification.actor,
      topComment: null,
    );
    if (!mounted) return;
    context.pushNamed(
      ArticleDetailScreen.routeName,
      pathParameters: {'articleId': articleId},
      extra: preview,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.notifications.title)),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refresh,
          child: FutureBuilder<NotificationFeed>(
            future: _future,
            builder: (context, snapshot) {
              return _NotificationFeedBody(
                snapshot: snapshot,
                onRetry: _refresh,
                onNotificationTap: _openNotification,
                loadingLabel: l10n.notifications.loading,
                emptyTitle: l10n.notifications.emptyTitle,
                emptySubtitle: l10n.notifications.emptySubtitle,
                errorMessage: l10n.notifications.error,
              );
            },
          ),
        ),
      ),
    );
  }
}

class _NotificationFeedBody extends StatelessWidget {
  const _NotificationFeedBody({
    required this.snapshot,
    required this.onRetry,
    required this.onNotificationTap,
    required this.loadingLabel,
    required this.emptyTitle,
    required this.emptySubtitle,
    required this.errorMessage,
  });

  final AsyncSnapshot<NotificationFeed> snapshot;
  final Future<void> Function() onRetry;
  final void Function(AppNotification notification) onNotificationTap;
  final String loadingLabel;
  final String emptyTitle;
  final String emptySubtitle;
  final String errorMessage;

  @override
  Widget build(BuildContext context) {
    if (snapshot.connectionState != ConnectionState.done) {
      return _ScrollableContainer(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 12),
              Text(loadingLabel),
            ],
          ),
        ),
      );
    }

    if (snapshot.hasError) {
      return _ScrollableContainer(
        child: _ErrorState(
          message: errorMessage,
          onRetry: onRetry,
        ),
      );
    }

    final feed = snapshot.data;
    if (feed == null || feed.notifications.isEmpty) {
      return _ScrollableContainer(
        child: _EmptyState(
          title: emptyTitle,
          subtitle: emptySubtitle,
        ),
      );
    }

    final showHeader = feed.unread > 0;
    final itemCount = feed.notifications.length + (showHeader ? 1 : 0);

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      itemCount: itemCount,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        if (showHeader && index == 0) {
          return _UnreadBanner(unread: feed.unread);
        }
        final adjustedIndex = showHeader ? index - 1 : index;
        final notification = feed.notifications[adjustedIndex];
        return _NotificationTile(
          notification: notification,
          onTap: () => onNotificationTap(notification),
        );
      },
    );
  }
}

class _UnreadBanner extends StatelessWidget {
  const _UnreadBanner({required this.unread});

  final int unread;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Colors.amber.withValues(alpha: 0.12),
        border: Border.all(color: Colors.amber.withValues(alpha: 0.4)),
      ),
      child: Text(
        unread == 1
            ? l10n.notifications.unreadSingle
            : l10n.notifications.unreadPlural(unread),
        style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({required this.notification, required this.onTap});

  final AppNotification notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;
    final iconData = _iconFor(notification.type);
    final articleTitle = notification.articleTitle ?? l10n.notifications.fallbackArticleTitle;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          color: notification.readAt == null
              ? Colors.white.withValues(alpha: 0.08)
              : Colors.white.withValues(alpha: 0.03),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconData.background,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(iconData.icon, color: iconData.foreground),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(notification.message,
                      style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  if (articleTitle.isNotEmpty)
                    Text(
                      articleTitle,
                      style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white70),
                    ),
                  if (notification.actor != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      l10n.notifications.fromActor(notification.actor!),
                      style: const TextStyle(fontSize: 12, color: Colors.white60),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Text(
                    _formatTimestamp(notification.createdAt),
                    style: const TextStyle(fontSize: 12, color: Colors.white54),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationIconData {
  const _NotificationIconData(this.icon, this.foreground, this.background);

  final IconData icon;
  final Color foreground;
  final Color background;
}

_NotificationIconData _iconFor(NotificationType type) {
  switch (type) {
    case NotificationType.articleComment:
      return _NotificationIconData(
        Icons.chat_bubble_outline,
        Colors.blue.shade200,
        Colors.blue.withValues(alpha: 0.15),
      );
    case NotificationType.commentReply:
      return _NotificationIconData(
        Icons.reply,
        Colors.purple.shade200,
        Colors.purple.withValues(alpha: 0.15),
      );
    case NotificationType.commentLike:
      return _NotificationIconData(
        Icons.favorite_border,
        Colors.pink.shade200,
        Colors.pink.withValues(alpha: 0.15),
      );
    case NotificationType.unknown:
      return _NotificationIconData(
        Icons.notifications_none,
        Colors.white70,
        Colors.white.withValues(alpha: 0.1),
      );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(message, textAlign: TextAlign.center),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: onRetry,
          icon: const Icon(Icons.refresh),
          label: Text(l10n.common.retry),
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 6),
        Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70)),
      ],
    );
  }
}

class _ScrollableContainer extends StatelessWidget {
  const _ScrollableContainer({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
      children: [child],
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
