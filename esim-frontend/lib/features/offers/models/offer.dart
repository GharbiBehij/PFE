class Offer {
  const Offer({
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
  final String popularity; // 'HIGH' | 'MEDIUM' | 'LOW'
  final int dataVolume;   // MB
  final int validityDays;
  final int price;        // millimes
  final DateTime createdAt;
  final DateTime updatedAt;

  String get formattedPrice => '${(price / 1000).toStringAsFixed(3)} TND';
  String get formattedData => dataVolume >= 1000
      ? '${(dataVolume / 1024).toStringAsFixed(0)} GB'
      : '$dataVolume MB';
  String get formattedValidity => '$validityDays Jours';
}
