import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../data/section_repository.dart';
import '../../../../l10n/l10n.dart';
import '../../../../models/section.dart';
import '../../../articles/presentation/screens/article_detail_screen.dart';
import '../widgets/section_card.dart';
import 'section_detail_screen.dart';

class SectionsScreen extends StatefulWidget {
  const SectionsScreen({super.key});

  @override
  State<SectionsScreen> createState() => _SectionsScreenState();
}

class _SectionsScreenState extends State<SectionsScreen> {
  final _repository = SectionRepository();
  late Future<List<Section>> _future;

  @override
  void initState() {
    super.initState();
    _future = _repository.fetchSections();
  }

  void _reload() {
    setState(() {
      _future = _repository.fetchSections();
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.sections.title,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(
                l10n.sections.subtitle,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white70),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: FutureBuilder<List<Section>>(
                  future: _future,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState != ConnectionState.done) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snapshot.hasError) {
                      return Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(l10n.sections.loadError, textAlign: TextAlign.center),
                          const SizedBox(height: 12),
                          TextButton.icon(
                            onPressed: _reload,
                            icon: const Icon(Icons.refresh),
                            label: Text(l10n.common.retry),
                          ),
                        ],
                      );
                    }
                    final data = snapshot.data ?? [];
                    return ListView.separated(
                      itemBuilder: (_, index) {
                        final section = data[index];
                        return SectionCard(
                          section: section,
                          onTap: () {
                            context.pushNamed(
                              SectionDetailScreen.routeName,
                              extra: section,
                            );
                          },
                          onArticleTap: (article) {
                            if (article.id.isEmpty) return;
                            context.pushNamed(
                              ArticleDetailScreen.routeName,
                              pathParameters: {'articleId': article.id},
                              extra: article,
                            );
                          },
                        );
                      },
                      separatorBuilder: (_, __) => const SizedBox(height: 20),
                      itemCount: data.length,
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
