import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleController extends ChangeNotifier {
  LocaleController._();

  static const _storageKey = 'dyson_forum_locale';
  static final LocaleController instance = LocaleController._();

  Locale _locale = const Locale('es');
  bool _loaded = false;
  SharedPreferences? _prefs;

  Locale get locale => _locale;
  bool get isLoaded => _loaded;

  Future<void> load() async {
    _prefs = await SharedPreferences.getInstance();
    final stored = _prefs?.getString(_storageKey);
    if (stored != null && stored.isNotEmpty) {
      _locale = Locale(stored);
    }
    _loaded = true;
    notifyListeners();
  }

  Future<void> setLocale(Locale locale) async {
    if (locale == _locale) return;
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, locale.languageCode);
    _locale = locale;
    notifyListeners();
  }
}
