import 'package:flutter/material.dart';

enum FlagSize { sm, md, lg }

const Map<String, String> _countryToIso2 = {
  'france': 'fr',
  'turkey': 'tr',
  'italy': 'it',
  'uae': 'ae',
  'united arab emirates': 'ae',
  'dubai': 'ae',
  'spain': 'es',
  'usa': 'us',
  'us': 'us',
  'united states': 'us',
  'united states of america': 'us',
  'morocco': 'ma',
  'tunisia': 'tn',
  'germany': 'de',
  'japan': 'jp',
  'egypt': 'eg',
  'canada': 'ca',
  'brazil': 'br',
  'india': 'in',
  'thailand': 'th',
  'singapore': 'sg',
  'australia': 'au',
  'south africa': 'za',
  'portugal': 'pt',
  'greece': 'gr',
  'netherlands': 'nl',
  'belgium': 'be',
  'switzerland': 'ch',
  'sweden': 'se',
  'norway': 'no',
  'denmark': 'dk',
  'poland': 'pl',
  'austria': 'at',
  'ireland': 'ie',
  'mexico': 'mx',
  'argentina': 'ar',
  'china': 'cn',
  'south korea': 'kr',
  'korea': 'kr',
  'saudi arabia': 'sa',
  'qatar': 'qa',
  'kuwait': 'kw',
  'oman': 'om',
  'uk': 'gb',
  'united kingdom': 'gb',
  'great britain': 'gb',
  'england': 'gb',
};

String? resolveCountryIso2(String value) {
  final normalized = value.trim().toLowerCase();
  if (normalized.isEmpty) return null;

  if (RegExp(r'^[a-z]{2}$').hasMatch(normalized)) {
    return normalized;
  }

  return _countryToIso2[normalized];
}

String? countryFlagImageUrl(String countryOrCode, {int width = 160}) {
  final iso2 = resolveCountryIso2(countryOrCode);
  if (iso2 == null) return null;
  return 'https://flagcdn.com/w$width/$iso2.png';
}

class CountryFlag extends StatelessWidget {
  const CountryFlag({
    required this.countryCode,
    this.size = FlagSize.md,
    super.key,
  });

  final String countryCode;
  final FlagSize size;

  static const _sizes = {
    FlagSize.sm: 18.0,
    FlagSize.md: 24.0,
    FlagSize.lg: 36.0,
  };

  @override
  Widget build(BuildContext context) {
    final height = _sizes[size]!;
    final width = height * 1.5;
    final url = countryFlagImageUrl(countryCode);

    if (url == null) {
      return SizedBox(
        width: width,
        height: height,
        child: const Center(
          child: Icon(Icons.public, size: 16, color: Color(0xFF9CA3AF)),
        ),
      );
    }

    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
      ),
      clipBehavior: Clip.antiAlias,
      child: Image.network(
        url,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => const ColoredBox(
          color: Color(0xFFF3F4F6),
          child: Center(
            child: Icon(
              Icons.flag_outlined,
              size: 16,
              color: Color(0xFF9CA3AF),
            ),
          ),
        ),
      ),
    );
  }
}
