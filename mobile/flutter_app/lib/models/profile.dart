class UserProfile {
  const UserProfile({
    required this.user,
    required this.stats,
    required this.publications,
  });

  final ProfileUser user;
  final ProfileStats stats;
  final List<ProfilePublication> publications;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final userJson = (json['user'] as Map<String, dynamic>? ?? const {});
    final statsJson = (json['stats'] as Map<String, dynamic>? ?? const {});
    final publicationsJson = (json['publications'] as List<dynamic>? ?? const []);
    return UserProfile(
      user: ProfileUser.fromJson(userJson),
      stats: ProfileStats.fromJson(statsJson),
      publications: publicationsJson
          .whereType<Map<String, dynamic>>()
          .map(ProfilePublication.fromJson)
          .toList(growable: false),
    );
  }
}

class ProfileUser {
  const ProfileUser({
    required this.id,
    required this.username,
    required this.email,
    required this.createdAt,
    this.image,
    this.bio,
  });

  final String id;
  final String username;
  final String email;
  final DateTime createdAt;
  final String? image;
  final String? bio;

  factory ProfileUser.fromJson(Map<String, dynamic> json) {
    return ProfileUser(
      id: (json['id'] ?? '').toString(),
      username: json['username'] as String? ?? '',
      email: json['email'] as String? ?? '',
      image: _readNullableString(json['image']),
      bio: _readNullableString(json['bio']),
      createdAt: _parseDate(json['createdAt']),
    );
  }
}

class ProfileStats {
  const ProfileStats({required this.articles, required this.comments, required this.score});

  final int articles;
  final int comments;
  final int score;

  factory ProfileStats.fromJson(Map<String, dynamic> json) {
    return ProfileStats(
      articles: _readInt(json['articles']),
      comments: _readInt(json['comments']),
      score: _readInt(json['score']),
    );
  }
}

class ProfilePublication {
  const ProfilePublication({
    required this.id,
    required this.title,
    required this.summary,
    required this.score,
    required this.comments,
    required this.createdAt,
    required this.section,
  });

  final String id;
  final String title;
  final String summary;
  final int score;
  final int comments;
  final DateTime createdAt;
  final ProfilePublicationSection section;

  factory ProfilePublication.fromJson(Map<String, dynamic> json) {
    return ProfilePublication(
      id: (json['id'] ?? '').toString(),
      title: json['title'] as String? ?? '',
      summary: json['summary'] as String? ?? '',
      score: _readInt(json['score']),
      comments: _readInt(json['comments']),
      createdAt: _parseDate(json['createdAt']),
      section: ProfilePublicationSection.fromJson(
        (json['section'] as Map<String, dynamic>? ?? const {}),
      ),
    );
  }
}

class ProfilePublicationSection {
  const ProfilePublicationSection({required this.name, required this.slug});

  final String name;
  final String slug;

  factory ProfilePublicationSection.fromJson(Map<String, dynamic> json) {
    return ProfilePublicationSection(
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
    );
  }
}

DateTime _parseDate(dynamic value) {
  if (value is DateTime) return value;
  if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
  if (value is String && value.isNotEmpty) {
    return DateTime.tryParse(value) ?? DateTime.now();
  }
  return DateTime.now();
}

int _readInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String && value.isNotEmpty) {
    return int.tryParse(value) ?? 0;
  }
  return 0;
}

String? _readNullableString(dynamic value) {
  if (value is String && value.isNotEmpty) {
    return value;
  }
  return null;
}
