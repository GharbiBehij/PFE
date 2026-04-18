import 'package:esim_frontend/features/offers/models/offer.dart';

class OfferDto {
  const OfferDto({
    required this.id,
    required this.country,
    required this.region,
    required this.destination,
    required this.category,
    required this.title,
    required this.description,
    required this.popularity,
    required this.dataVolume,
    required this.validityDays,
    required this.price,
    required this.createdAt,
    required this.updatedAt,
  });

  final int id;
  final String country;
  final String region;
  final String destination;
  final String category;
  final String title;
  final String description;
  final String popularity;
  final int dataVolume;
  final int validityDays;
  final int price;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory OfferDto.fromJson(Map<String, dynamic> json) => OfferDto(
        id: json['id'] as int,
        country: json['country'] as String,
        region: (json['region'] ?? json['Region'] ?? '') as String,
        destination: (json['destination'] ?? json['Destination'] ?? '') as String,
        category: (json['category'] ?? json['Category'] ?? '') as String,
        title: (json['title'] ?? '') as String,
        description: (json['description'] ?? '') as String,
        popularity: (json['popularity'] ?? '') as String,
        dataVolume: json['dataVolume'] as int,
        validityDays: json['validityDays'] as int,
        price: json['price'] as int,
        createdAt: DateTime.parse(json['createdAt'] as String),
        updatedAt: DateTime.parse(json['updatedAt'] as String),
      );

  Offer toDomain() => Offer(
        id: id,
        country: country,
        region: region,
        destination: destination,
        category: category,
        title: title,
        description: description,
        popularity: popularity,
        dataVolume: dataVolume,
        validityDays: validityDays,
        price: price,
        createdAt: createdAt,
        updatedAt: updatedAt,
      );
}
