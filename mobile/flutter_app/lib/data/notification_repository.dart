import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/api_config.dart';
import '../core/auth_store.dart';
import '../models/app_notification.dart';

class NotificationRepository {
  NotificationRepository({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<NotificationFeed> fetchNotifications() async {
    final response = await _client.get(
      buildApiUri('/api/mobile/notifications'),
      headers: {
        'Content-Type': 'application/json',
        ...AuthStore.instance.authHeaders(),
      },
    );

    if (response.statusCode >= 400) {
      throw Exception(_decodeError(response.body) ?? 'No pudimos cargar tus notificaciones');
    }

    final Map<String, dynamic> json = jsonDecode(response.body) as Map<String, dynamic>;
    return NotificationFeed.fromJson(json);
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
