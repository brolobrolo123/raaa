import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/api_config.dart';
import '../core/auth_store.dart';
import '../models/profile.dart';

class ProfileRepository {
  ProfileRepository({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<UserProfile> fetchProfile() async {
    final response = await _client.get(
      buildApiUri('/api/mobile/profile'),
      headers: {
        'Content-Type': 'application/json',
        ...AuthStore.instance.authHeaders(),
      },
    );

    if (response.statusCode >= 400) {
      throw Exception(_decodeError(response.body) ?? 'No pudimos obtener tu perfil');
    }

    final Map<String, dynamic> json = jsonDecode(response.body) as Map<String, dynamic>;
    return UserProfile.fromJson(json);
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final response = await _client.post(
      buildApiUri('/api/mobile/profile/password'),
      headers: {
        'Content-Type': 'application/json',
        ...AuthStore.instance.authHeaders(),
      },
      body: jsonEncode({
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      }),
    );

    if (response.statusCode >= 400) {
      throw Exception(_decodeError(response.body) ?? 'No pudimos actualizar tu contraseña');
    }
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
