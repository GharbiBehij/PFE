class Destination {
  const Destination({
    required this.country,
    required this.region,
    required this.imageUrl,
    required this.lowestPrice,
  });

  final String country;
  final String region;
  final String imageUrl;
  final int lowestPrice; // cents

  factory Destination.fromJson(Map<String, dynamic> json) => Destination(
        country: json['country'] as String,
      region: (json['region'] ?? json['Region'] ?? '') as String,
        imageUrl: json['imageUrl'] as String? ?? '',
      lowestPrice: (json['lowestPrice'] ?? json['price'] ?? 0) as int,
      );

  String get formattedPrice => '${(lowestPrice / 100).toStringAsFixed(0)}€';
}
