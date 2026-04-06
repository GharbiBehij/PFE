import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum FlagSize { sm, md, lg }

/// Emoji flag map — populated from offer/esim API countries.
/// Call [CountryFlagNotifier.loadFrom] after fetching offers.
class CountryFlagNotifier extends StateNotifier<Map<String, String>> {
  CountryFlagNotifier() : super(const {});

  void loadFrom(List<String> countryCodes) {
    // TODO: derive emoji flags from ISO country codes once offer API is wired
    state = {for (final code in countryCodes) code.toLowerCase(): '🌐'};
  }
}

final countryFlagProvider =
    StateNotifierProvider<CountryFlagNotifier, Map<String, String>>(
  (_) => CountryFlagNotifier(),
);

class CountryFlag extends ConsumerWidget {
  const CountryFlag({required this.countryCode, this.size = FlagSize.md, super.key});

  final String countryCode;
  final FlagSize size;

  static const _sizes = {FlagSize.sm: 18.0, FlagSize.md: 24.0, FlagSize.lg: 36.0};

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final flags = ref.watch(countryFlagProvider);
    final emoji = flags[countryCode.toLowerCase()] ?? '🌐';
    return Text(emoji, style: TextStyle(fontSize: _sizes[size]));
  }
}
