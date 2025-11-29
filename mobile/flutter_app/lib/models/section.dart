import 'article.dart';

enum SectionFilter { top, recent }

class Section {
  const Section({
    required this.slug,
    required this.name,
    required this.description,
    required this.tagline,
    required this.accentColor,
    required this.articles,
  });

  final String slug;
  final String name;
  final String description;
  final String tagline;
  final int accentColor;
  final List<Article> articles;

  factory Section.fromJson(Map<String, dynamic> json) {
    final articles = (json['articles'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(Article.fromJson)
        .toList(growable: false);

    return Section(
      slug: json['slug'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      tagline: json['tagline'] as String? ?? '',
      accentColor: _parseColor(json['accentColor']),
      articles: articles,
    );
  }
}

int _parseColor(dynamic value) {
  if (value is int) {
    if (value <= 0xFFFFFF) {
      return 0xFF000000 | value;
    }
    return value;
  }
  if (value is String && value.isNotEmpty) {
    final hex = value.replaceFirst('#', '');
    final normalized = hex.length == 6 ? 'FF$hex' : hex;
    return int.tryParse(normalized, radix: 16) ?? 0xFF2563EB;
  }
  return 0xFF2563EB;
}
