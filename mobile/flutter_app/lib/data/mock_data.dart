import 'package:collection/collection.dart';

import '../models/article.dart';
import '../models/section.dart';

final List<Section> mockSections = [
  Section(
    slug: 'historia-alternativa',
    name: 'Qué hubiera pasado si…',
    description: 'Ideas o historias que imaginan cómo habría sido el mundo si un evento del pasado hubiera ocurrido diferente.',
    tagline: 'Ideas que imaginan otros desenlaces históricos.',
    accentColor: 0xFF2563EB,
    articles: _generateArticles('historia-alternativa'),
  ),
  Section(
    slug: 'nueva-mirada-a-la-historia',
    name: 'Una Interpretación Distinta',
    description: 'Opiniones o análisis que intentan explicar un suceso histórico de una forma distinta a la versión tradicional.',
    tagline: 'Opiniones que rompen la versión oficial.',
    accentColor: 0xFF0D9488,
    articles: _generateArticles('nueva-mirada-a-la-historia'),
  ),
  Section(
    slug: 'teorias-conspirativas',
    name: 'Teorías Conspirativas',
    description: 'Ideas que dicen que lo que pasó en la historia fue manipulado, ocultado o controlado.',
    tagline: 'Ideas sobre hechos manipulados y ocultos.',
    accentColor: 0xFFF97316,
    articles: _generateArticles('teorias-conspirativas'),
  ),
];

List<Article> _generateArticles(String slug) {
  return List<Article>.generate(8, (index) {
    final now = DateTime.now();
    return Article(
      id: '$slug-$index',
      title: 'Relato #${index + 1} · ${slug.replaceAll('-', ' ')}',
      summary: 'Explora posibles derivaciones del archivo ${slug.replaceAll('-', ' ')} con pistas cruzadas y teoría contrastada.',
      score: 40 - index * 2,
      comments: 15 - index,
      createdAt: now.subtract(Duration(hours: index * 3)),
    );
  });
}

Section? findSectionBySlug(String slug) {
  return mockSections.firstWhereOrNull((section) => section.slug == slug);
}
