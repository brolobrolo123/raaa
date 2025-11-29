import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/api_config.dart';
import '../core/auth_store.dart';
import '../models/section.dart';
import '../models/section_snapshot.dart';

class SectionRepository {
  SectionRepository({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<List<Section>> fetchSections() async {
    final response = await _client.get(
      buildApiUri('/api/mobile/sections'),
      headers: {
        'Content-Type': 'application/json',
        ...AuthStore.instance.authHeaders(),
      },
    );

    if (response.statusCode >= 400) {
      throw Exception(_decodeError(response.body) ?? 'No se pudieron cargar las secciones');
    }

    final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
    return data
        .whereType<Map<String, dynamic>>()
        .map(Section.fromJson)
        .toList(growable: false);
  }

  Future<SectionSnapshot> fetchSectionSnapshot(
    String slug, {
    SectionSnapshotView view = SectionSnapshotView.defaultView,
    int page = 1,
  }) async {
    final response = await _client.get(
      buildApiUri(
        '/api/mobile/sections/$slug',
        {
          'view': view.queryParam,
          if (page > 1) 'page': page.toString(),
        },
      ),
      headers: {
        'Content-Type': 'application/json',
        ...AuthStore.instance.authHeaders(),
      },
    );

    if (response.statusCode >= 400) {
      throw Exception(_decodeError(response.body) ?? 'No se pudo cargar la sección');
    }

    final Map<String, dynamic> data = jsonDecode(response.body) as Map<String, dynamic>;
    return SectionSnapshot.fromJson(data);
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
