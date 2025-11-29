class AppNotification {
  const AppNotification({
    required this.id,
    required this.message,
    required this.createdAt,
    required this.type,
    this.readAt,
    this.actor,
    this.articleId,
    this.articleTitle,
    this.commentId,
  });

  final String id;
  final String message;
  final DateTime createdAt;
  final DateTime? readAt;
  final NotificationType type;
  final String? actor;
  final String? articleId;
  final String? articleTitle;
  final String? commentId;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    final actor = _readActor(json['actor']);
    final article = _readArticle(json['article']);
    return AppNotification(
      id: (json['id'] ?? '').toString(),
      message: json['message'] as String? ?? '',
      type: NotificationTypeX.from(json['type'] as String?),
      createdAt: _parseDate(json['createdAt']),
      readAt: _parseNullableDate(json['readAt']),
      actor: actor,
      articleId: article.$1,
      articleTitle: article.$2,
      commentId: _readNullableString(json['commentId']),
    );
  }
}

class NotificationFeed {
  const NotificationFeed({required this.notifications, required this.unread});

  final List<AppNotification> notifications;
  final int unread;

  factory NotificationFeed.fromJson(Map<String, dynamic> json) {
    final rawItems = json['notifications'] as List<dynamic>? ?? const [];
    final items = rawItems
        .whereType<Map<String, dynamic>>()
        .map(AppNotification.fromJson)
        .toList(growable: false);

    return NotificationFeed(
      notifications: items,
      unread: _readInt(json['unread']),
    );
  }
}

enum NotificationType { articleComment, commentReply, commentLike, unknown }

extension NotificationTypeX on NotificationType {
  static NotificationType from(String? value) {
    switch (value) {
      case 'ARTICLE_COMMENT':
        return NotificationType.articleComment;
      case 'COMMENT_REPLY':
        return NotificationType.commentReply;
      case 'COMMENT_LIKE':
        return NotificationType.commentLike;
      default:
        return NotificationType.unknown;
    }
  }
}

DateTime _parseDate(dynamic value) {
  if (value is DateTime) return value;
  if (value is int) {
    return DateTime.fromMillisecondsSinceEpoch(value);
  }
  if (value is String && value.isNotEmpty) {
    return DateTime.tryParse(value) ?? DateTime.now();
  }
  return DateTime.now();
}

DateTime? _parseNullableDate(dynamic value) {
  if (value == null) return null;
  final parsed = _parseDate(value);
  return parsed;
}

String? _readActor(dynamic value) {
  if (value is String && value.isNotEmpty) {
    return value;
  }
  if (value is Map<String, dynamic>) {
    final username = value['username'];
    if (username is String && username.isNotEmpty) {
      return username;
    }
  }
  return null;
}

(String?, String?) _readArticle(dynamic value) {
  if (value is Map<String, dynamic>) {
    final id = _readNullableString(value['id']);
    final title = _readNullableString(value['title']);
    return (id, title);
  }
  return (null, null);
}

String? _readNullableString(dynamic value) {
  if (value is String && value.isNotEmpty) {
    return value;
  }
  return null;
}

int _readInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String && value.isNotEmpty) {
    return int.tryParse(value) ?? 0;
  }
  return 0;
}
