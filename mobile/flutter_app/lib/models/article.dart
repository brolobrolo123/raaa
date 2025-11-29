class Article {
  const Article({
    required this.id,
    required this.title,
    required this.summary,
    required this.score,
    required this.comments,
    required this.createdAt,
    this.author,
    this.topComment,
  });

  final String id;
  final String title;
  final String summary;
  final int score;
  final int comments;
  final DateTime createdAt;
  final String? author;
  final ArticleTopComment? topComment;

  factory Article.fromJson(Map<String, dynamic> json) {
    return Article(
      id: (json['id'] ?? '').toString(),
      title: json['title'] as String? ?? '',
      summary: json['summary'] as String? ?? '',
      score: _readInt(json['score']),
      comments: _readInt(json['comments']),
      createdAt: _readDate(json['createdAt']),
      author: _readAuthor(json['author']),
      topComment: ArticleTopComment.tryParse(json['topComment']),
    );
  }
}

class ArticleTopComment {
  const ArticleTopComment({
    required this.body,
    required this.author,
    required this.score,
  });

  final String body;
  final String author;
  final int score;

  factory ArticleTopComment.fromJson(Map<String, dynamic> json) {
    return ArticleTopComment(
      body: json['body'] as String? ?? '',
      score: _readInt(json['score']),
      author: _readAuthor(json['author']) ?? '',
    );
  }

  static ArticleTopComment? tryParse(dynamic value) {
    if (value is Map<String, dynamic>) {
      return ArticleTopComment.fromJson(value);
    }
    return null;
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
  if (value is int) {
    return DateTime.fromMillisecondsSinceEpoch(value);
  }
  if (value is String && value.isNotEmpty) {
    return DateTime.tryParse(value) ?? DateTime.now();
  }
  return DateTime.now();
}

String? _readAuthor(dynamic value) {
  if (value is String) return value;
  if (value is Map<String, dynamic>) {
    final username = value['username'];
    if (username is String && username.isNotEmpty) {
      return username;
    }
  }
  return null;
}
