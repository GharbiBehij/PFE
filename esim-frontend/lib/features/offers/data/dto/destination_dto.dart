import 'package:esim_frontend/features/offers/models/destination.dart';

class DestinationDto {
  const DestinationDto({
    required this.country,
    required this.region,
    required this.imageUrl,
    required this.lowestPrice,
    required this.coverageType,
    required this.popularity,
  });

  final String country;
  final String region;
  final String imageUrl;
  final int lowestPrice;
  final String coverageType;
  final int popularity;

  factory DestinationDto.fromJson(Map<String, dynamic> json) {
    final region = (json['region'] ?? json['Region'] ?? '').toString();
    final rawCoverage =
        (json['coverageType'] ?? json['coverage_type'] ?? '').toString();

    return DestinationDto(
      country: json['country'].toString(),
      region: region,
      imageUrl: (json['imageUrl'] as String?) ?? '',
      lowestPrice: _toInt(json['lowestPrice'] ?? json['price']),
      coverageType: rawCoverage.isNotEmpty
          ? rawCoverage.toUpperCase()
          : _coverageFromRegion(region),
      popularity: _parsePopularity(json['popularity']),
    );
  }

  Destination toDomain() => Destination(
        country: country,
        region: region,
        imageUrl: imageUrl,
        lowestPrice: lowestPrice,
        coverageType: coverageType,
        popularity: popularity,
      );

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.round();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  static String _coverageFromRegion(String region) {
    final normalized = region.trim().toLowerCase();
    if (normalized.isEmpty) return 'LOCAL';
    if (normalized.contains('global') || normalized.contains('world')) {
      return 'GLOBAL';
    }
    if (normalized.contains('europe') ||
        normalized.contains('asia') ||
        normalized.contains('africa') ||
        normalized.contains('america') ||
        normalized.contains('middle east')) {
      return 'REGIONAL';
    }
    return 'LOCAL';
  }

  static int _parsePopularity(dynamic raw) {
    if (raw is int) return raw;
    if (raw is num) return raw.round();

    final value = raw?.toString().trim().toUpperCase() ?? '';
    if (value.isEmpty) return 0;

    const scoreByWord = {
      'VERY_HIGH': 4,
      'HIGH': 3,
      'MEDIUM': 2,
      'LOW': 1,
    };

    if (scoreByWord.containsKey(value)) {
      return scoreByWord[value]!;
    }

    return int.tryParse(value) ?? 0;
  }
}
