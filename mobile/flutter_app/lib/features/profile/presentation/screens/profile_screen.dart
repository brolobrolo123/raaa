import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../data/profile_repository.dart';
import '../../../../l10n/l10n.dart';
import '../../../../models/article.dart';
import '../../../../models/profile.dart';
import '../../../articles/presentation/screens/article_detail_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _repository = ProfileRepository();
  late Future<UserProfile> _future;

  @override
  void initState() {
    super.initState();
    _future = _repository.fetchProfile();
  }

  void _handleBack() {
    final navigator = Navigator.of(context);
    if (navigator.canPop()) {
      navigator.maybePop();
    } else {
      context.go('/home');
    }
  }

  Future<void> _refresh() async {
    setState(() {
      _future = _repository.fetchProfile();
    });
    try {
      await _future;
    } catch (_) {
      // handled by builder
    }
  }

  void _openArticle(ProfilePublication publication, ProfileUser user) {
    if (publication.id.isEmpty) return;
    final preview = Article(
      id: publication.id,
      title: publication.title,
      summary: publication.summary,
      score: publication.score,
      comments: publication.comments,
      createdAt: publication.createdAt,
      author: user.username,
      topComment: null,
    );

    context.pushNamed(
      ArticleDetailScreen.routeName,
      pathParameters: {'articleId': publication.id},
      extra: preview,
    );
  }

  Future<void> _showChangePasswordSheet() async {
    final messenger = ScaffoldMessenger.of(context);
    final l10n = context.l10n;
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) {
        return _ChangePasswordSheet(
          onSubmit: (current, updated) async {
            await _repository.changePassword(
              currentPassword: current,
              newPassword: updated,
            );
          },
        );
      },
    );

    if (result == true) {
      messenger.showSnackBar(
        SnackBar(content: Text(l10n.profile.passwordUpdated)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _handleBack,
        ),
        title: Text(l10n.profile.title),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refresh,
          child: FutureBuilder<UserProfile>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return _CenteredMessage(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const CircularProgressIndicator(),
                      const SizedBox(height: 12),
                      Text(l10n.profile.syncing),
                    ],
                  ),
                );
              }

              if (snapshot.hasError || snapshot.data == null) {
                return _CenteredMessage(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(l10n.profile.loadError),
                      const SizedBox(height: 12),
                      FilledButton.icon(
                        onPressed: _refresh,
                        icon: const Icon(Icons.refresh),
                        label: Text(l10n.common.retry),
                      ),
                    ],
                  ),
                );
              }

              final profile = snapshot.data!;
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                children: [
                  _ProfileHeader(user: profile.user),
                  const SizedBox(height: 20),
                  _StatsGrid(stats: profile.stats),
                  const SizedBox(height: 24),
                  if (profile.user.bio != null && profile.user.bio!.isNotEmpty) ...[
                    _InfoCard(
                      title: l10n.profile.bio,
                      child: Text(profile.user.bio!, style: const TextStyle(height: 1.4)),
                    ),
                    const SizedBox(height: 24),
                  ],
                  _PublicationsSection(
                    publications: profile.publications,
                    onArticleTap: (publication) => _openArticle(publication, profile.user),
                  ),
                  const SizedBox(height: 24),
                  _SecurityCard(onChangePassword: _showChangePasswordSheet),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.user});

  final ProfileUser user;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        color: Colors.white.withValues(alpha: 0.04),
      ),
      child: Row(
        children: [
          _AvatarPlaceholder(imageUrl: user.image, label: user.username),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(user.username,
                    style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(user.email, style: const TextStyle(color: Colors.white70)),
                const SizedBox(height: 8),
                Text(l10n.profile.memberSince(_formatDate(user.createdAt)),
                    style: const TextStyle(fontSize: 12, color: Colors.white54)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.stats});

  final ProfileStats stats;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    const minTileWidth = 140.0;
    const spacing = 12.0;

    final tiles = [
      _StatTile(label: l10n.profile.statsArticles, value: stats.articles),
      _StatTile(label: l10n.profile.statsComments, value: stats.comments),
      _StatTile(label: l10n.profile.statsReactions, value: stats.score),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final availableWidth = constraints.maxWidth.isFinite
            ? constraints.maxWidth
            : MediaQuery.sizeOf(context).width;
        final rawCount = (availableWidth / minTileWidth).floor();
        final crossAxisCount = math.max(1, math.min(3, rawCount)).toInt();
        final spacingWidth = spacing * math.max(0, crossAxisCount - 1);
        final tileWidth = (availableWidth - spacingWidth) / crossAxisCount;
        final childAspectRatio = (tileWidth / 110).clamp(0.8, 1.4).toDouble();

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: tiles.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: spacing,
            mainAxisSpacing: spacing,
            childAspectRatio: childAspectRatio,
          ),
          itemBuilder: (context, index) => tiles[index],
        );
      },
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        color: Colors.white.withValues(alpha: 0.03),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: AlignmentDirectional.centerStart,
            child: Text(
              '$value',
              style:
                  Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(color: Colors.white70),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
        color: Colors.white.withValues(alpha: 0.02),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

class _PublicationsSection extends StatelessWidget {
  const _PublicationsSection({
    required this.publications,
    required this.onArticleTap,
  });

  final List<ProfilePublication> publications;
  final ValueChanged<ProfilePublication> onArticleTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;
    if (publications.isEmpty) {
      return _InfoCard(
        title: l10n.profile.publicationsEmptyTitle,
        child: Text(l10n.profile.publicationsEmptySubtitle),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.profile.publicationsTitle, style: theme.textTheme.titleMedium),
        const SizedBox(height: 12),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemBuilder: (context, index) {
            final publication = publications[index];
            return _PublicationTile(
              publication: publication,
              onTap: () => onArticleTap(publication),
            );
          },
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemCount: publications.length,
        ),
      ],
    );
  }
}

class _PublicationTile extends StatelessWidget {
  const _PublicationTile({required this.publication, required this.onTap});

  final ProfilePublication publication;
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
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        publication.title,
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        publication.summary,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white70),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Icon(Icons.chevron_right, color: Colors.white.withValues(alpha: 0.7)),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                _MetaChip(icon: Icons.auto_awesome, label: publication.section.name),
                _MetaChip(icon: Icons.favorite_border, label: '+${publication.score}'),
                _MetaChip(
                    icon: Icons.chat_bubble_outline,
                    label: '${publication.comments} ${context.l10n.profile.statsComments}'),
                _MetaChip(icon: Icons.schedule, label: _formatDate(publication.createdAt)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: Colors.white.withValues(alpha: 0.08),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.white70),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.white70)),
        ],
      ),
    );
  }
}

class _SecurityCard extends StatelessWidget {
  const _SecurityCard({required this.onChangePassword});

  final Future<void> Function() onChangePassword;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return _InfoCard(
      title: l10n.profile.securityTitle,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l10n.profile.securityDescription),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: () => onChangePassword(),
            icon: const Icon(Icons.lock_reset),
            label: Text(l10n.profile.securityCta),
          ),
        ],
      ),
    );
  }
}

class _ChangePasswordSheet extends StatefulWidget {
  const _ChangePasswordSheet({required this.onSubmit});

  final Future<void> Function(String currentPassword, String newPassword) onSubmit;

  @override
  State<_ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends State<_ChangePasswordSheet> {
  final _formKey = GlobalKey<FormState>();
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isSubmitting = true;
      _error = null;
    });
    try {
      await widget.onSubmit(_currentController.text.trim(), _newController.text.trim());
      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (error) {
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets.bottom;
    final l10n = context.l10n;
    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + viewInsets),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(l10n.profile.passwordSheetTitle, style: Theme.of(context).textTheme.titleMedium),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).maybePop(),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _currentController,
              obscureText: true,
              decoration: InputDecoration(
                labelText: l10n.profile.currentPasswordLabel,
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return l10n.profile.currentPasswordError;
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _newController,
              obscureText: true,
              decoration: InputDecoration(
                labelText: l10n.profile.newPasswordLabel,
                helperText: l10n.profile.newPasswordHelper,
              ),
              validator: (value) {
                if (value == null || value.length < 8) {
                  return l10n.profile.newPasswordError;
                }
                if (value == _currentController.text) {
                  return l10n.profile.newPasswordMatchError;
                }
                return null;
              },
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.redAccent)),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _isSubmitting ? null : _submit,
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(l10n.profile.savePassword),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AvatarPlaceholder extends StatelessWidget {
  const _AvatarPlaceholder({this.imageUrl, required this.label});

  final String? imageUrl;
  final String label;

  @override
  Widget build(BuildContext context) {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Image.network(imageUrl!, width: 64, height: 64, fit: BoxFit.cover),
      );
    }

    final trimmed = label.trim();
    final initials = trimmed.isNotEmpty ? trimmed[0].toUpperCase() : '?';
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Colors.white.withValues(alpha: 0.12),
      ),
      alignment: Alignment.center,
      child: Text(initials, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
    );
  }
}

class _CenteredMessage extends StatelessWidget {
  const _CenteredMessage({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
      children: [
        Center(child: child),
      ],
    );
  }
}

String _formatDate(DateTime date) {
  final day = date.day.toString().padLeft(2, '0');
  final month = date.month.toString().padLeft(2, '0');
  final year = date.year;
  return '$day/$month/$year';
}
