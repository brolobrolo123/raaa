class ArticleDetail {
  const ArticleDetail({
    required this.id,
    required this.title,
    required this.summary,
    required this.content,
    required this.score,
    required this.comments,
    required this.createdAt,
    required this.section,
    required this.author,
    required this.commentTree,
    this.coverColor,
  });

  final String id;
  final String title;
  final String summary;
  final String content;
  final int score;
  final int comments;
  final DateTime createdAt;
  final ArticleDetailSection section;
  final ArticleDetailAuthor author;
  final List<ArticleDetailComment> commentTree;
  final String? coverColor;

  factory ArticleDetail.fromPayload(Map<String, dynamic> json) {
    final articleJson = json['article'] as Map<String, dynamic>? ?? const {};
    final commentsJson = json['comments'] as List<dynamic>? ?? const [];

    return ArticleDetail(
      id: (articleJson['id'] ?? '').toString(),
      title: articleJson['title'] as String? ?? '',
      summary: articleJson['summary'] as String? ?? '',
      content: articleJson['content'] as String? ?? '',
      score: _readInt(articleJson['score']),
      comments: _readInt(articleJson['comments']),
      createdAt: _readDate(articleJson['createdAt']),
      section: ArticleDetailSection.fromJson(articleJson['section'] as Map<String, dynamic>? ?? const {}),
      author: ArticleDetailAuthor.fromJson(articleJson['author'] as Map<String, dynamic>? ?? const {}),
      coverColor: articleJson['coverColor'] as String?,
      commentTree: commentsJson
          .whereType<Map<String, dynamic>>()
          .map(ArticleDetailComment.fromJson)
          .toList(growable: false),
    );
  }

  String get plainContent {
    final buffer = StringBuffer();
    final raw = content.replaceAll('<br>', '\n');
    final sanitized = raw.replaceAll(RegExp(r'<[^>]+>'), '');
    final normalized = sanitized.replaceAll(RegExp(r'\n{3,}'), '\n\n');
    buffer.write(normalized.trim());
    return buffer.toString();
  }
}

class ArticleDetailAuthor {
  const ArticleDetailAuthor({required this.username, this.image});

  final String username;
  final String? image;

  factory ArticleDetailAuthor.fromJson(Map<String, dynamic> json) {
    return ArticleDetailAuthor(
      username: json['username'] as String? ?? 'Anónimo',
      image: json['image'] as String?,
    );
  }
}

class ArticleDetailSection {
  const ArticleDetailSection({required this.slug, required this.name});

  final String slug;
  final String name;

  factory ArticleDetailSection.fromJson(Map<String, dynamic> json) {
    return ArticleDetailSection(
      slug: json['slug'] as String? ?? '',
      name: json['name'] as String? ?? '',
    );
  }
}

class ArticleDetailComment {
  const ArticleDetailComment({
    required this.id,
    required this.body,
    required this.score,
    required this.createdAt,
    required this.author,
    required this.replies,
  });

  final String id;
  final String body;
  final int score;
  final DateTime createdAt;
  final ArticleDetailAuthor author;
  final List<ArticleDetailComment> replies;

  factory ArticleDetailComment.fromJson(Map<String, dynamic> json) {
    final repliesJson = json['replies'] as List<dynamic>? ?? const [];
    return ArticleDetailComment(
      id: (json['id'] ?? '').toString(),
      body: json['body'] as String? ?? '',
      score: _readInt(json['score']),
      createdAt: _readDate(json['createdAt']),
      author: ArticleDetailAuthor.fromJson(json['author'] as Map<String, dynamic>? ?? const {}),
      replies: repliesJson
          .whereType<Map<String, dynamic>>()
          .map(ArticleDetailComment.fromJson)
          .toList(growable: false),
    );
  }
}

int _readInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String && value.isNotEmpty) {
    return int.tryParse(value) ?? 0;
  }
  return 0;
}

DateTime _readDate(dynamic value) {
  if (value is DateTime) return value;
  if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
  if (value is String && value.isNotEmpty) {
    return DateTime.tryParse(value) ?? DateTime.now();
  }
  return DateTime.now();
}
