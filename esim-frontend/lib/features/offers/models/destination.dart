class Destination {
  const Destination({
    required this.country,
    required this.region,
    required this.imageUrl,
    required this.lowestPrice,
    this.coverageType = 'LOCAL',
    this.popularity = 0,
  });

  final String country;
  final String region;
  final String imageUrl;
  final int lowestPrice; // cents
  final String coverageType; // LOCAL | REGIONAL | GLOBAL
  final int popularity;

  String get formattedPrice => '${(lowestPrice / 1000).toStringAsFixed(3)} TND';
}
