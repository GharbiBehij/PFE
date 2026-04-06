class Offer {
  const Offer({
    required this.id,
    required this.country,
    required this.region,
    required this.destination,
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
  final int dataVolume;   // MB
  final int validityDays;
  final int price;        // cents
  final DateTime createdAt;
  final DateTime updatedAt;

  factory Offer.fromJson(Map<String, dynamic> json) => Offer(
        id: json['id'] as int,
        country: json['country'] as String,
      region: (json['region'] ?? json['Region'] ?? '') as String,
      destination: (json['destination'] ?? json['Destination'] ?? '') as String,
        dataVolume: json['dataVolume'] as int,
        validityDays: json['validityDays'] as int,
        price: json['price'] as int,
        createdAt: DateTime.parse(json['createdAt'] as String),
        updatedAt: DateTime.parse(json['updatedAt'] as String),
      );

  String get formattedPrice => '${(price / 100).toStringAsFixed(0)} TND';
  String get formattedData => dataVolume >= 1000
      ? '${(dataVolume / 1024).toStringAsFixed(0)} GB'
      : '$dataVolume MB';
  String get formattedValidity => '$validityDays Jours';
}
