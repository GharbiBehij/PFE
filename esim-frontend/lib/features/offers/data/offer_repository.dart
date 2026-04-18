import 'package:esim_frontend/features/offers/data/dto/destination_dto.dart';
import 'package:esim_frontend/features/offers/data/dto/offer_dto.dart';
import 'package:esim_frontend/features/offers/data/offer_datasource.dart';
import 'package:esim_frontend/features/offers/models/destination.dart';
import 'package:esim_frontend/features/offers/models/offer.dart';

class OfferRepository {
  const OfferRepository(this._datasource);

  final OfferDatasource _datasource;



  Future<List<Offer>> getPopularOffers() async {
    final raw = await _datasource.getPopularOffers();
    return raw.map((j) => OfferDto.fromJson(j).toDomain()).toList();
  }

  Future<List<Offer>> getOffersByCountry(String country) async {
    final raw = await _datasource.getOffersByCountry(country);
    return raw.map((j) => OfferDto.fromJson(j).toDomain()).toList();
  }

  Future<List<Offer>> searchOffers(String query) async {
    final raw = await _datasource.searchOffers(query);
    return raw.map((j) => OfferDto.fromJson(j).toDomain()).toList();
  }

  Future<Offer> getOfferById(int id) async {
    final raw = await _datasource.getOfferById(id);
    return OfferDto.fromJson(raw).toDomain();
  }

  Future<List<Destination>> getDestinations() async {
    final raw = await _datasource.getDestinations();
    return raw.map((j) {
      final d = DestinationDto.fromJson(j).toDomain();
      if (d.imageUrl.trim().isNotEmpty) return d;

      return Destination(
        country: d.country,
        region: d.region,
        imageUrl: d.imageUrl,
        lowestPrice: d.lowestPrice,
        coverageType: d.coverageType,
        popularity: d.popularity,
      );
    }).toList();
  }
}
