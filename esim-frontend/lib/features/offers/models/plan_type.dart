enum PlanType {
  standard,
  unlimited;

  String get label {
    switch (this) {
      case PlanType.standard:
        return 'Standard';
      case PlanType.unlimited:
        return 'Unlimited';
    }
  }

  // Offers up to 25 GB are treated as standard plans.
  static const int dataThresholdMB = 25000;

  static PlanType fromDataVolume(int dataVolumeMB) {
    return dataVolumeMB <= dataThresholdMB
        ? PlanType.standard
        : PlanType.unlimited;
  }
}
