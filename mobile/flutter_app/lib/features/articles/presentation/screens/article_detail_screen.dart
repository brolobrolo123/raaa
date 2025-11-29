import 'package:flutter/material.dart';

import '../../../../data/article_repository.dart';
import '../../../../models/article.dart';
import '../../../../models/article_detail.dart';

class ArticleDetailScreen extends StatefulWidget {
  const ArticleDetailScreen({super.key, required this.articleId, this.initialPreview});

  static const routeName = 'article-detail';

  final String articleId;
  final Article? initialPreview;

  @override
  State<ArticleDetailScreen> createState() => _ArticleDetailScreenState();
}

class _ArticleDetailScreenState extends State<ArticleDetailScreen> {
  final _repository = ArticleRepository();
  late Future<ArticleDetail> _future;
  bool _isVoting = false;
  bool _isSubmittingComment = false;
  String? _commentVoteInFlight;

  @override
  void initState() {
    super.initState();
    _future = _repository.fetchArticle(widget.articleId);
  }

  Future<void> _reload() async {
    setState(() {
      _future = _repository.fetchArticle(widget.articleId);
    });
    try {
      await _future;
    } catch (_) {
      // handled by FutureBuilder
    }
  }

  Future<void> _handleVote(ArticleDetail detail) async {
    if (_isVoting) return;
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _isVoting = true);
    try {
      await _repository.toggleArticleVote(detail.id);
      messenger.showSnackBar(const SnackBar(content: Text('Gracias por apoyar esta teoría')));
      await _reload();
    } catch (error) {
      messenger.showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) {
        setState(() => _isVoting = false);
      }
    }
  }

  Future<void> _startCommentComposer({ArticleDetailComment? parent}) async {
    final text = await _showCommentDialog(parent == null ? 'Nuevo comentario' : 'Responder comentario');
    if (text == null || text.trim().length < 3) {
      return;
    }
    await _submitComment(text.trim(), parentId: parent?.id);
  }

  Future<String?> _showCommentDialog(String title) async {
    final controller = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final isValid = controller.text.trim().length >= 3;
            return AlertDialog(
              title: Text(title),
              content: TextField(
                controller: controller,
                minLines: 3,
                maxLines: 5,
                autofocus: true,
                onChanged: (_) => setDialogState(() {}),
                decoration: const InputDecoration(
                  hintText: 'Comparte tu hipótesis…',
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('Cancelar'),
                ),
                FilledButton(
                  onPressed: isValid
                      ? () => Navigator.of(dialogContext).pop(controller.text.trim())
                      : null,
                  child: const Text('Publicar'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _submitComment(String text, {String? parentId}) async {
    if (_isSubmittingComment) return;
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _isSubmittingComment = true);
    try {
      await _repository.createComment(articleId: widget.articleId, body: text, parentId: parentId);
      messenger.showSnackBar(const SnackBar(content: Text('Comentario publicado')));
      await _reload();
    } catch (error) {
      messenger.showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmittingComment = false);
      }
    }
  }

  Future<void> _handleCommentVote(ArticleDetailComment comment) async {
    if (_commentVoteInFlight == comment.id) return;
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _commentVoteInFlight = comment.id);
    try {
      await _repository.toggleCommentVote(comment.id);
      await _reload();
    } catch (error) {
      messenger.showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) {
        setState(() => _commentVoteInFlight = null);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final previewTitle = widget.initialPreview?.title;
    return Scaffold(
      appBar: AppBar(
        title: FutureBuilder<ArticleDetail>(
          future: _future,
          builder: (context, snapshot) {
            final title = snapshot.data?.title ?? previewTitle ?? 'Detalle de teoría';
            return Text(title);
          },
        ),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _reload,
          child: FutureBuilder<ArticleDetail>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const _CenteredMessage(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 12),
                      Text('Cargando teoría…'),
                    ],
                  ),
                );
              }

              if (snapshot.hasError || snapshot.data == null) {
                return _CenteredMessage(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('No pudimos abrir este artículo.'),
                      const SizedBox(height: 12),
                      FilledButton.icon(
                        onPressed: _reload,
                        icon: const Icon(Icons.refresh),
                        label: const Text('Reintentar'),
                      ),
                    ],
                  ),
                );
              }

              final detail = snapshot.data!;
              final plainContent = detail.plainContent.isNotEmpty ? detail.plainContent : detail.content;

              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                children: [
                  _SectionChip(name: detail.section.name),
                  const SizedBox(height: 12),
                  Text(
                    detail.title,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  _MetaRow(detail: detail),
                  const SizedBox(height: 16),
                  _ArticleActions(
                    score: detail.score,
                    commentCount: detail.comments,
                    isVoting: _isVoting,
                    isCommenting: _isSubmittingComment,
                    onVote: () => _handleVote(detail),
                    onComment: () => _startCommentComposer(),
                  ),
                  const SizedBox(height: 16),
                  if (detail.summary.isNotEmpty)
                    Text(
                      detail.summary,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(color: Colors.white70),
                    ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                      color: Colors.white.withValues(alpha: 0.03),
                    ),
                    child: Text(
                      plainContent,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.5),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text('Comentarios destacados', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  if (detail.commentTree.isEmpty)
                    const Text('Aún no hay comentarios. Sé el primero en reaccionar.', style: TextStyle(color: Colors.white70))
                  else
                    Column(
                      children: [
                        for (var i = 0; i < detail.commentTree.length; i++) ...[
                          _CommentThread(
                            comment: detail.commentTree[i],
                            onReply: _isSubmittingComment ? null : (comment) => _startCommentComposer(parent: comment),
                            onLike: (comment) => _handleCommentVote(comment),
                            pendingCommentId: _commentVoteInFlight,
                          ),
                          if (i < detail.commentTree.length - 1) const SizedBox(height: 12),
                        ],
                      ],
                    ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _SectionChip extends StatelessWidget {
  const _SectionChip({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white24),
        color: Colors.white.withValues(alpha: 0.05),
      ),
      child: Text(name.toUpperCase(), style: const TextStyle(fontSize: 12, letterSpacing: 1.5)),
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.detail});

  final ArticleDetail detail;

  @override
  Widget build(BuildContext context) {
    final createdAt = _formatTimestamp(detail.createdAt);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('por ${detail.author.username}', style: const TextStyle(color: Colors.white70)),
        const SizedBox(height: 4),
        Text('$createdAt · ↑ ${detail.score} · 💬 ${detail.comments}', style: const TextStyle(color: Colors.white54)),
      ],
    );
  }
}

class _ArticleActions extends StatelessWidget {
  const _ArticleActions({
    required this.score,
    required this.commentCount,
    required this.isVoting,
    required this.isCommenting,
    required this.onVote,
    required this.onComment,
  });

  final int score;
  final int commentCount;
  final bool isVoting;
  final bool isCommenting;
  final VoidCallback onVote;
  final VoidCallback onComment;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        FilledButton.icon(
          onPressed: isVoting ? null : onVote,
          icon: isVoting
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.thumb_up_alt_outlined),
          label: Text('Apoyar ($score)'),
        ),
        OutlinedButton.icon(
          onPressed: isCommenting ? null : onComment,
          icon: const Icon(Icons.chat_bubble_outline),
          label: Text('Comentar ($commentCount)'),
        ),
      ],
    );
  }
}

class _CommentThread extends StatelessWidget {
  const _CommentThread({
    required this.comment,
    this.depth = 0,
    this.onReply,
    this.onLike,
    this.pendingCommentId,
  });

  final ArticleDetailComment comment;
  final int depth;
  final ValueChanged<ArticleDetailComment>? onReply;
  final ValueChanged<ArticleDetailComment>? onLike;
  final String? pendingCommentId;

  @override
  Widget build(BuildContext context) {
    final isPending = pendingCommentId == comment.id;
    return Container(
      margin: EdgeInsets.only(left: depth * 16.0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        color: Colors.white.withValues(alpha: 0.02),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(comment.author.username, style: const TextStyle(fontWeight: FontWeight.w600))),
              Text(_formatTimestamp(comment.createdAt), style: const TextStyle(fontSize: 12, color: Colors.white54)),
            ],
          ),
          const SizedBox(height: 6),
          Text(comment.body),
          const SizedBox(height: 8),
          Row(
            children: [
              Text('↑ ${comment.score}', style: const TextStyle(fontSize: 12, color: Colors.white54)),
              IconButton(
                iconSize: 18,
                visualDensity: VisualDensity.compact,
                tooltip: 'Apoyar comentario',
                icon: isPending
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.thumb_up_alt_outlined, size: 18),
                onPressed: (onLike == null || isPending) ? null : () => onLike!(comment),
              ),
              TextButton(
                onPressed: onReply == null ? null : () => onReply!(comment),
                child: const Text('Responder'),
              ),
            ],
          ),
          if (comment.replies.isNotEmpty) ...[
            const SizedBox(height: 12),
            for (final reply in comment.replies)
              _CommentThread(
                comment: reply,
                depth: depth + 1,
                onReply: onReply,
                onLike: onLike,
                pendingCommentId: pendingCommentId,
              ),
          ],
        ],
      ),
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

String _formatTimestamp(DateTime date) {
  final day = date.day.toString().padLeft(2, '0');
  final month = date.month.toString().padLeft(2, '0');
  final hour = date.hour.toString().padLeft(2, '0');
  final minute = date.minute.toString().padLeft(2, '0');
  return '$day/$month · $hour:$minute';
}
