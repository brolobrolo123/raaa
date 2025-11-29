class AuthUser {
  const AuthUser({
    required this.id,
    required this.username,
    this.email,
    this.image,
  });

  final String id;
  final String username;
  final String? email;
  final String? image;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      username: json['username'] as String? ?? '',
      email: json['email'] as String?,
      image: json['image'] as String?,
    );
  }
}

class AuthSession {
  const AuthSession({required this.token, required this.user});

  final String token;
  final AuthUser user;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      token: json['token'] as String,
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}
