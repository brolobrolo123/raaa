import 'package:flutter/foundation.dart';

/// Simple app-wide notifier to refresh feeds when new content is created.
class FeedNotifier extends ChangeNotifier {
  FeedNotifier._();

  static final FeedNotifier instance = FeedNotifier._();

  void articlePublished() {
    notifyListeners();
  }
}
