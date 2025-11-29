import 'article.dart';
import 'section.dart';

class SectionSnapshot {
  const SectionSnapshot({
    required this.section,
    required this.topArticles,
    required this.recentArticles,
    required this.hasMoreRecent,
    required this.view,
    required this.page,
  });

  final Section section;
  final List<Article> topArticles;
  final List<Article> recentArticles;
  final bool hasMoreRecent;
  final SectionSnapshotView view;
  final int page;

  factory SectionSnapshot.fromJson(Map<String, dynamic> json) {
    final sectionJson = Map<String, dynamic>.from(
        json['section'] as Map<String, dynamic>? ?? const {});

    List<Article> parseArticles(List<dynamic> raw) {
      return raw
          .whereType<Map<String, dynamic>>()
          .map(Article.fromJson)
          .toList(growable: false);
    }

    final rawTopArticles = json['topArticles'] as List<dynamic>? ?? const [];
    final rawRecentArticles =
        json['recentArticles'] as List<dynamic>? ?? const [];
    final topArticles = parseArticles(rawTopArticles);
    final recentArticles = parseArticles(rawRecentArticles);

    sectionJson['articles'] ??= _rawArticlesForView(
        json['view'] as String?, rawTopArticles, rawRecentArticles);

    return SectionSnapshot(
      section: Section.fromJson(sectionJson),
      topArticles: topArticles,
      recentArticles: recentArticles,
      hasMoreRecent: json['hasMoreRecent'] as bool? ?? false,
      view: SectionSnapshotViewX.from(json['view'] as String?),
      page: (json['page'] as int?) ?? 1,
    );
  }
}

enum SectionSnapshotView { defaultView, top, recent }

extension SectionSnapshotViewX on SectionSnapshotView {
  static SectionSnapshotView from(String? value) {
    switch (value) {
      case 'top':
        return SectionSnapshotView.top;
      case 'recent':
        return SectionSnapshotView.recent;
      default:
        return SectionSnapshotView.defaultView;
    }
  }

  String get queryParam {
    switch (this) {
      case SectionSnapshotView.top:
        return 'top';
      case SectionSnapshotView.recent:
        return 'recent';
      case SectionSnapshotView.defaultView:
        return 'default';
    }
  }
}

List<dynamic> _rawArticlesForView(
  String? view,
  List<dynamic> topArticles,
  List<dynamic> recentArticles,
) {
  switch (view) {
    case 'recent':
      return recentArticles;
    case 'top':
      return topArticles;
    default:
      return topArticles.isNotEmpty ? topArticles : recentArticles;
  }
}
