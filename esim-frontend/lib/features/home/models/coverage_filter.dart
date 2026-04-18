import 'package:flutter/material.dart';

enum CoverageFilter {
  local,
  regional,
  global,
  popular;

  String get label {
    switch (this) {
      case CoverageFilter.local:
        return 'Local';
      case CoverageFilter.regional:
        return 'Régional';
      case CoverageFilter.global:
        return 'Global';
      case CoverageFilter.popular:
        return 'Populaire';
    }
  }

  IconData get icon {
    switch (this) {
      case CoverageFilter.local:
        return Icons.location_on_outlined;
      case CoverageFilter.regional:
        return Icons.public_outlined;
      case CoverageFilter.global:
        return Icons.language_outlined;
      case CoverageFilter.popular:
        return Icons.trending_up_rounded;
    }
  }
}
