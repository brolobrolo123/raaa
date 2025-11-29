const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:3000',
);

Uri buildApiUri(String path, [Map<String, dynamic>? queryParameters]) {
  final uri = Uri.parse('$apiBaseUrl$path');
  if (queryParameters == null) {
    return uri;
  }
  return uri.replace(queryParameters: {
    ...uri.queryParameters,
    ...queryParameters.map((key, value) => MapEntry(key, value?.toString() ?? '')),
  });
}
