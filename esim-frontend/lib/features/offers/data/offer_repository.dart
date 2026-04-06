import 'package:esim_frontend/features/offers/data/offer_datasource.dart';
import 'package:esim_frontend/features/offers/models/destination.dart';
import 'package:esim_frontend/features/offers/models/offer.dart';

class OfferRepository {
  const OfferRepository(this._datasource);

  final OfferDatasource _datasource;

  Future<List<Offer>> getPopularOffers() async {
    final raw = await _datasource.getPopularOffers();
    return raw.map(Offer.fromJson).toList();
  }

  Future<List<Offer>> getOffersByCountry(String country) async {
    final raw = await _datasource.getOffersByCountry(country);
    return raw.map(Offer.fromJson).toList();
  }

  Future<List<Offer>> searchOffers(String query) async {
    final raw = await _datasource.searchOffers(query);
    return raw.map(Offer.fromJson).toList();
  }

  Future<Offer> getOfferById(int id) async {
    final raw = await _datasource.getOfferById(id);
    return Offer.fromJson(raw);
  }

  Future<List<Destination>> getDestinations() async {
    final raw = await _datasource.getDestinations();
    return raw.map(Destination.fromJson).toList();
  }
}
