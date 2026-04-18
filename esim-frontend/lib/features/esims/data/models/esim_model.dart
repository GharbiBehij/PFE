import 'package:intl/intl.dart';

enum EsimStatus {
  pending,
  active,
  expired,
  deleted,
}

extension EsimStatusX on EsimStatus {
  static EsimStatus fromBackend(String? raw) {
    final value = (raw ?? '').toUpperCase();
    return switch (value) {
      'ACTIVE' => EsimStatus.active,
      'EXPIRED' => EsimStatus.expired,
      'DELETED' => EsimStatus.deleted,
      'PENDING' || 'PROCESSING' || 'NOT_ACTIVE' => EsimStatus.pending,
      _ => EsimStatus.pending,
    };
  }

  String get backendValue {
    return switch (this) {
      EsimStatus.pending => 'PENDING',
      EsimStatus.active => 'ACTIVE',
      EsimStatus.expired => 'EXPIRED',
      EsimStatus.deleted => 'DELETED',
    };
  }

  String get labelFr {
    return switch (this) {
      EsimStatus.pending => 'En attente',
      EsimStatus.active => 'Actif',
      EsimStatus.expired => 'Expir\u00e9',
      EsimStatus.deleted => 'Supprim\u00e9',
    };
  }
}

class EsimOfferModel {
  const EsimOfferModel({
    required this.id,
    required this.country,
    required this.region,
    required this.destination,
    required this.dataVolume,
    required this.validityDays,
    required this.price,
  });

  final String id;
  final String country;
  final String region;
  final String destination;
  final int dataVolume;
  final int validityDays;
  final int price;

  factory EsimOfferModel.fromJson(Map<String, dynamic> json) {
    return EsimOfferModel(
      id: (json['id'] ?? '').toString(),
      country: (json['country'] ?? '').toString(),
      region: (json['region'] ?? json['Region'] ?? '').toString(),
      destination: (json['destination'] ?? json['Destination'] ?? '').toString(),
      dataVolume: EsimModel.parseInt(json['dataVolume']),
      validityDays: EsimModel.parseInt(json['validityDays']),
      price: EsimModel.parseInt(json['price']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'country': country,
      'region': region,
      'destination': destination,
      'dataVolume': dataVolume,
      'validityDays': validityDays,
      'price': price,
    };
  }

  String get title => destination.isNotEmpty ? destination : country;

  String get countryCode {
    if (country.length < 2) return country.toLowerCase();
    return country.substring(0, 2).toLowerCase();
  }
}

class EsimModel {
  const EsimModel({
    required this.id,
    required this.qrCode,
    required this.iccid,
    required this.status,
    required this.dataTotal,
    required this.dataUsed,
    required this.activatedAt,
    required this.expiresAt,
    required this.offer,
  });

  final String id;
  final String? qrCode;
  final String iccid;
  final EsimStatus status;
  final int dataTotal;
  final int dataUsed;
  final DateTime? activatedAt;
  final DateTime? expiresAt;
  final EsimOfferModel offer;

  factory EsimModel.fromJson(Map<String, dynamic> json) {
    final offerJson = json['offer'];
    final fallbackOffer = {
      'id': json['offerId'] ?? json['offer_id'] ?? '',
      'country': json['country'] ?? '',
      'region': json['region'] ?? json['Region'] ?? '',
      'destination': json['destination'] ?? json['Destination'] ?? json['country'] ?? '',
      'dataVolume': json['dataTotal'] ?? 0,
      'validityDays': json['validityDays'] ?? 0,
      'price': json['price'] ?? 0,
    };

    return EsimModel(
      id: (json['id'] ?? '').toString(),
      qrCode: _normalizeNullableString(json['qrCode']),
      iccid: (json['iccid'] ?? '').toString(),
      status: EsimStatusX.fromBackend(json['status']?.toString()),
      dataTotal: parseInt(json['dataTotal']),
      dataUsed: parseInt(json['dataUsed']),
      activatedAt: _parseDate(json['activatedAt']),
      expiresAt: _parseDate(json['expiresAt'] ?? json['expiryDate']),
      offer: EsimOfferModel.fromJson(
        (offerJson is Map<String, dynamic>) ? offerJson : fallbackOffer,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'qrCode': qrCode,
      'iccid': iccid,
      'status': status.backendValue,
      'dataTotal': dataTotal,
      'dataUsed': dataUsed,
      'activatedAt': activatedAt?.toIso8601String(),
      'expiresAt': expiresAt?.toIso8601String(),
      'offer': offer.toJson(),
    };
  }

  EsimModel copyWith({
    String? id,
    String? qrCode,
    String? iccid,
    EsimStatus? status,
    int? dataTotal,
    int? dataUsed,
    DateTime? activatedAt,
    DateTime? expiresAt,
    EsimOfferModel? offer,
  }) {
    return EsimModel(
      id: id ?? this.id,
      qrCode: qrCode ?? this.qrCode,
      iccid: iccid ?? this.iccid,
      status: status ?? this.status,
      dataTotal: dataTotal ?? this.dataTotal,
      dataUsed: dataUsed ?? this.dataUsed,
      activatedAt: activatedAt ?? this.activatedAt,
      expiresAt: expiresAt ?? this.expiresAt,
      offer: offer ?? this.offer,
    );
  }

  static int parseInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  double get usageRatio {
    if (dataTotal <= 0) return 0;
    return (dataUsed / dataTotal).clamp(0.0, 1.0);
  }

  int get usagePercent => (usageRatio * 100).round();

  int get dataRemaining => (dataTotal - dataUsed).clamp(0, dataTotal);

  bool get isPending => status == EsimStatus.pending;

  bool get isActive => status == EsimStatus.active;

  bool get isExpired => status == EsimStatus.expired;

  bool get canDelete => isExpired || status == EsimStatus.deleted;

  int? get daysRemaining {
    final exp = expiresAt;
    if (exp == null) return null;
    final diff = exp.difference(DateTime.now()).inDays;
    return diff < 0 ? 0 : diff;
  }

  String get destinationLabel => offer.title;

  String get formattedDataUsed => _formatData(dataUsed);

  String get formattedDataTotal => _formatData(dataTotal);

  String get formattedDataRemaining => _formatData(dataRemaining);

  String get usageSummaryFr =>
      '$formattedDataUsed utilises sur $formattedDataTotal';

  String get formattedActivatedAt => _formatDate(activatedAt);

  String get formattedExpiresAt => _formatDate(expiresAt);

  static String _formatData(int mb) {
    if (mb >= 1024) {
      final gb = mb / 1024;
      final digits = gb >= 10 ? 0 : 1;
      return '${gb.toStringAsFixed(digits)} GB';
    }
    return '$mb MB';
  }

  static String _formatDate(DateTime? date) {
    if (date == null) return '-';
    return DateFormat('dd/MM/yyyy').format(date.toLocal());
  }

  static DateTime? _parseDate(dynamic raw) {
    if (raw == null) return null;
    final value = raw.toString();
    if (value.isEmpty) return null;
    return DateTime.tryParse(value);
  }

  static String? _normalizeNullableString(dynamic raw) {
    if (raw == null) return null;
    final value = raw.toString().trim();
    return value.isEmpty ? null : value;
  }
}
