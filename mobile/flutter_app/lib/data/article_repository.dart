import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/api_config.dart';
import '../core/auth_store.dart';
import '../models/article.dart';
import '../models/article_detail.dart';

class ArticleRepository {
  ArticleRepository({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<void> createArticle({
    required String sectionSlug,
    required String title,
    required String summary,
    required String content,
    String? coverColor,
  }) async {
    final response = await _client.post(
      buildApiUri('/api/mobile/articles'),
      headers: {
        'Content-Type': 'application/json',
        ...AuthStore.instance.authHeaders(),
      },
      body: jsonEncode({
        'section': sectionSlug,
        'title': title,
        'summary': summary,
        'content': content,
        if (coverColor != null && coverColor.isNotEmpty) 'coverColor': coverColor,
      }),
    );

    if (response.statusCode >= 400) {
      throw Exception(_decodeError(response.body) ?? 'No se pudo publicar tu teoría');
    }
  }

  Future<ArticleDetail> fetchArticle(String articleId) async {
    final response = await _client.get(
      buildApiUri('/api/mobile/articles/$articleId'),
      headers: AuthStore.instance.authHeaders(),
    );

    if (response.statusCode >= 400) {
      throw Exception(_decodeError(response.body) ?? 'No pudimos abrir esta teoría');
    }

    final Map<String, dynamic> json = jsonDecode(response.body) as Map<String, dynamic>;
    return ArticleDetail.fromPayload(json);
  }

  Future<List<Article>> fetchRecentArticles({int limit = 3}) async {
    final response = await _client.get(
      buildApiUri('/api/mobile/articles/recent', {'limit': limit.toString()}),
      headers: {
        'Content-Type': 'application/json',
        ...AuthStore.instance.authHeaders(),
      },
    );

    if (response.statusCode >= 400) {
      throw Exception(_decodeError(response.body) ?? 'No pudimos cargar los artículos recientes');
    }

    final List<dynamic> json = jsonDecode(response.body) as List<dynamic>;
    return json
        .whereType<Map<String, dynamic>>()
        .map(Article.fromJson)
        .toList(growable: false);
  }

  Future<int> toggleArticleVote(String articleId) async {
    final response = await _client.post(
      buildApiUri('/api/mobile/articles/$articleId/vote'),
      headers: {
        'Content-Type': 'application/json',
        ...AuthStore.instance.authHeaders(),
      },
    );

    if (response.statusCode >= 400) {
      throw Exception(_decodeError(response.body) ?? 'No pudimos registrar tu voto');
    }

    final Map<String, dynamic> json = jsonDecode(response.body) as Map<String, dynamic>;
    final score = json['score'];
    if (score is num) {
      return score.toInt();
    }
    return 0;
  }

  Future<void> createComment({
    required String articleId,
    required String body,
    String? parentId,
  }) async {
    final response = await _client.post(
      buildApiUri('/api/mobile/articles/$articleId/comments'),
      headers: {
        'Content-Type': 'application/json',
        ...AuthStore.instance.authHeaders(),
      },
      body: jsonEncode({
        'body': body,
        if (parentId != null) 'parentId': parentId,
      }),
    );

    if (response.statusCode >= 400) {
      throw Exception(_decodeError(response.body) ?? 'No pudimos publicar tu comentario');
    }
  }

  Future<bool> toggleCommentVote(String commentId) async {
    final response = await _client.post(
      buildApiUri('/api/mobile/comments/$commentId/vote'),
      headers: {
        'Content-Type': 'application/json',
        ...AuthStore.instance.authHeaders(),
      },
    );

    if (response.statusCode >= 400) {
      throw Exception(_decodeError(response.body) ?? 'No pudimos actualizar tu reacción');
    }

    final Map<String, dynamic> json = jsonDecode(response.body) as Map<String, dynamic>;
    return json['liked'] == true;
  }

  String? _decodeError(String body) {
    try {
      final Map<String, dynamic> json = jsonDecode(body) as Map<String, dynamic>;
      final message = json['error'] ?? json['message'];
      if (message is String && message.isNotEmpty) {
        return message;
      }
    } catch (_) {
      return null;
    }
    return null;
  }
}
