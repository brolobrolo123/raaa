import '../features/auth/models/auth_session.dart';

class AuthStore {
  AuthStore._();

  static final AuthStore instance = AuthStore._();

  AuthSession? _session;

  AuthSession? get session => _session;

  void save(AuthSession session) {
    _session = session;
  }

  void clear() {
    _session = null;
  }

  Map<String, String> authHeaders() {
    final token = _session?.token;
    if (token == null) {
      return const {};
    }
    return {'Authorization': 'Bearer $token'};
  }
}
