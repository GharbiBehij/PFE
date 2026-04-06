import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:esim_frontend/core/providers/core_providers.dart';
import 'package:esim_frontend/features/offers/data/offer_datasource.dart';
import 'package:esim_frontend/features/offers/data/offer_repository.dart';
import 'package:esim_frontend/features/offers/models/destination.dart';
import 'package:esim_frontend/features/offers/models/offer.dart';

final offerDatasourceProvider = Provider<OfferDatasource>((ref) {
  return OfferDatasource(ref.read(dioProvider));
});

final offerRepositoryProvider = Provider<OfferRepository>((ref) {
  return OfferRepository(ref.read(offerDatasourceProvider));
});

final popularOffersProvider = FutureProvider<List<Offer>>((ref) {
  return ref.read(offerRepositoryProvider).getPopularOffers();
});

final destinationsProvider = FutureProvider<List<Destination>>((ref) {
  return ref.read(offerRepositoryProvider).getDestinations();
});

final offersByCountryProvider =
    FutureProvider.family<List<Offer>, String>((ref, country) {
  return ref.read(offerRepositoryProvider).getOffersByCountry(country);
});

final offerDetailProvider =
    FutureProvider.family<Offer, int>((ref, id) {
  return ref.read(offerRepositoryProvider).getOfferById(id);
});

final searchOffersProvider =
    FutureProvider.family<List<Offer>, String>((ref, query) {
  return ref.read(offerRepositoryProvider).searchOffers(query);
});
