import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../../core/api_config.dart';
import '../../../core/auth_store.dart';
import '../models/auth_session.dart';

class AuthRepository {
  AuthRepository({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<AuthSession> login({required String credential, required String password}) async {
    final response = await _client.post(
      buildApiUri('/api/mobile/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'credential': credential, 'password': password}),
    );

    if (response.statusCode >= 400) {
      final error = _decodeError(response.body);
      throw Exception(error ?? 'No se pudo iniciar sesión');
    }

    final Map<String, dynamic> json = jsonDecode(response.body) as Map<String, dynamic>;
    final session = AuthSession.fromJson(json);
    AuthStore.instance.save(session);
    return session;
  }

  Future<void> register({
    required String username,
    required String email,
    required String password,
  }) async {
    final response = await _client.post(
      buildApiUri('/api/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'username': username,
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode >= 400) {
      final error = _decodeError(response.body);
      throw Exception(error ?? 'No se pudo crear la cuenta');
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
