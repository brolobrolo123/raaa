import 'package:flutter/material.dart';

import '../../../../models/article.dart';
import '../../../../models/section.dart';

class SectionCard extends StatelessWidget {
  const SectionCard({
    super.key,
    required this.section,
    required this.onTap,
    this.onArticleTap,
  });

  final Section section;
  final VoidCallback onTap;
  final ValueChanged<Article>? onArticleTap;

  @override
  Widget build(BuildContext context) {
    final color = Color(section.accentColor);
    return InkWell(
      borderRadius: BorderRadius.circular(32),
      onTap: onTap,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          section.name,
                          style: Theme.of(context)
                              .textTheme
                              .headlineSmall
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          section.tagline,
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: color.withValues(alpha: 0.4)),
                      gradient: LinearGradient(
                        colors: [
                          color.withValues(alpha: 0.25),
                          color.withValues(alpha: 0.05),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Text(section.slug.replaceAll('-', ' ').toUpperCase(),
                        style: const TextStyle(fontSize: 10, letterSpacing: 2)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                section.description,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: Colors.white.withValues(alpha: 0.85)),
              ),
              const SizedBox(height: 24),
              SizedBox(
                height: 180,
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    color: Colors.white.withValues(alpha: 0.05),
                    border:
                        Border.all(color: Colors.white.withValues(alpha: 0.08)),
                  ),
                  padding: const EdgeInsets.all(16),
                  child: ListView.separated(
                    padding: EdgeInsets.zero,
                    physics: const NeverScrollableScrollPhysics(),
                    itemBuilder: (_, index) {
                      final article = section.articles[index];
                      return GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: onArticleTap == null
                            ? null
                            : () => onArticleTap!(article),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              article.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              article.summary,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 12, color: Colors.white70),
                            ),
                          ],
                        ),
                      );
                    },
                    separatorBuilder: (_, __) =>
                        const Divider(height: 16, color: Colors.white24),
                    itemCount: section.articles.length > 3
                        ? 3
                        : section.articles.length,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Align(
                alignment: Alignment.bottomLeft,
                child: TextButton.icon(
                  onPressed: onTap,
                  icon: const Icon(Icons.radio_button_unchecked, size: 16),
                  label: const Text('Entrar a la sección'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
