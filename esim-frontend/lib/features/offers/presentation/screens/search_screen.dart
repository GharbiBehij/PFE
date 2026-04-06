import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/core/widgets/destination_card.dart';
import 'package:esim_frontend/core/widgets/empty_state.dart';
import 'package:esim_frontend/features/offers/models/destination.dart';
import 'package:esim_frontend/features/offers/models/offer.dart';
import 'package:esim_frontend/features/offers/presentation/providers/offer_providers.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  String _query = '';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      setState(() => _query = value.trim());
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ────────────────────────────────────────────────────
            Container(
              color: AppColors.surface,
              padding: const EdgeInsets.fromLTRB(4, 8, 16, 12),
              child: Column(
                children: [
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back),
                        onPressed: () => context.pop(),
                      ),
                      const Expanded(
                        child: Text(
                          'Trouver une destination',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 48),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(AppRadius.input),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Row(
                      children: [
                        const Icon(Icons.search,
                            color: AppColors.textSecondary, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _controller,
                            focusNode: _focusNode,
                            autofocus: true,
                            onChanged: _onChanged,
                            decoration: InputDecoration(
                              hintText: 'Chercher une destination...',
                              hintStyle: const TextStyle(
                                  color: AppColors.textSecondary),
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              contentPadding: EdgeInsets.zero,
                              fillColor: Colors.transparent,
                              filled: false,
                              suffixIcon: _controller.text.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear,
                                          size: 18,
                                          color: AppColors.textSecondary),
                                      onPressed: () {
                                        _controller.clear();
                                        setState(() => _query = '');
                                      },
                                    )
                                  : null,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ── Results ───────────────────────────────────────────────────
            Expanded(
              child: _query.isEmpty
                  ? _AllDestinations(query: _query)
                  : _SearchResults(query: _query),
            ),
          ],
        ),
      ),
    );
  }
}

class _AllDestinations extends ConsumerWidget {
  const _AllDestinations({required this.query});

  final String query;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(destinationsProvider);
    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => EmptyState(
        message: 'Erreur de chargement',
        onRetry: () => ref.invalidate(destinationsProvider),
      ),
      data: (all) => _ResultsList(
        title: 'Toutes les destinations',
        destinations: all,
      ),
    );
  }
}

class _SearchResults extends ConsumerWidget {
  const _SearchResults({required this.query});

  final String query;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(searchOffersProvider(query));
    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => const EmptyState(message: 'Erreur de recherche'),
      data: (offers) {
        if (offers.isEmpty) {
          return EmptyState(
            icon: Icons.search_off,
            message: 'Aucun résultat pour "$query"',
          );
        }
        final Map<String, Offer> byCountry = {};
        for (final o in offers) {
          if (!byCountry.containsKey(o.country) ||
              o.price < byCountry[o.country]!.price) {
            byCountry[o.country] = o;
          }
        }
        final entries = byCountry.values.toList();
        return _OfferList(title: 'Résultats pour "$query"', offers: entries);
      },
    );
  }
}

class _ResultsList extends StatelessWidget {
  const _ResultsList({required this.title, required this.destinations});

  final String title;
  final List<Destination> destinations;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${destinations.length} trouvé(s)',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (destinations.isEmpty)
          const Expanded(
            child: EmptyState(message: 'Aucune destination trouvée'),
          )
        else
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: destinations.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) => DestinationCard(
                id: destinations[i].country,
                name: destinations[i].country,
                imageUrl: destinations[i].imageUrl,
                price: destinations[i].lowestPrice / 100,
              ),
            ),
          ),
      ],
    );
  }
}

class _OfferList extends StatelessWidget {
  const _OfferList({required this.title, required this.offers});

  final String title;
  final List<Offer> offers;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${offers.length} trouvé(s)',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: offers.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) => DestinationCard(
              id: offers[i].country,
              name: offers[i].country,
              imageUrl:
                  'https://picsum.photos/seed/${offers[i].country}/400/300',
              price: offers[i].price / 100,
            ),
          ),
        ),
      ],
    );
  }
}
