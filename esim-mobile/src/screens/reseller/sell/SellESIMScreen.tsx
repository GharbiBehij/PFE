import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../../components/layout';
import { useDestinations, useOffersByCountry } from '../../../hooks/client/useOffers';
import { usePurchase } from '../../../hooks/client/usePayment';
import { useWallet } from '../../../hooks/reseller/useWallet';
import type { ResellerSellStackParamList } from '../../../navigation/types';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../../../theme';
import type { Destination, Offer } from '../../../types/offer';
import { formatCurrency } from '../../../utils/formatCurrency';
import { ActionButton, OutlineButton } from '../../../components/Buttons';

type Props = NativeStackScreenProps<ResellerSellStackParamList, 'Sell'>;
type Step = 1 | 2 | 3;
type SellPaymentMethod = 'wallet' | 'cash';

const stepConfig: Array<{ label: string; value: Step }> = [
  { label: 'Forfait', value: 1 },
  { label: 'Client', value: 2 },
  { label: 'Paiement', value: 3 },
];

export const SellESIMScreen = ({ navigation }: Props) => {
  const tabBarHeight = useBottomTabBarHeight();
  const wallet = useWallet();
  const destinationsQuery = useDestinations();
  const purchaseMutation = usePurchase();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [activateNow, setActivateNow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<SellPaymentMethod>('wallet');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setCurrentStep(1);
      setSearchQuery('');
      setShowAutocomplete(false);
      setSelectedCountryId(null);
      setSelectedOfferId(null);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setActivateNow(true);
      setPaymentMethod('wallet');
      setPurchaseError(null);
    }, []),
  );

  const offersQuery = useOffersByCountry(selectedCountryId ?? '');

  const destinations = useMemo(() => destinationsQuery.data ?? [], [destinationsQuery.data]);
  const offers = useMemo(() => offersQuery.data ?? [], [offersQuery.data]);

  const filteredDestinations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return destinations
      .filter((d) => {
        const country = (d.country ?? '').toLowerCase();
        const region = (d.Region ?? '').toLowerCase();
        return country.includes(query) || region.includes(query);
      })
      .slice(0, 8);
  }, [destinations, searchQuery]);

  const selectedDestination = useMemo<Destination | null>(() => {
    if (!selectedCountryId) return null;
    return destinations.find((d) => d.country === selectedCountryId) ?? null;
  }, [destinations, selectedCountryId]);

  const selectedOffer = useMemo<Offer | null>(() => {
    if (selectedOfferId === null) return null;
    return offers.find((o) => o.id === selectedOfferId) ?? null;
  }, [offers, selectedOfferId]);

  const walletBalance = wallet.balance;
  const remainingBalance = selectedOffer ? walletBalance - selectedOffer.price : walletBalance;

  useEffect(() => {
    if (selectedOfferId === null) return;
    const stillExists = offers.some((o) => o.id === selectedOfferId);
    if (!stillExists) setSelectedOfferId(null);
  }, [offers, selectedOfferId]);

  const canProceedStep1 = Boolean(selectedCountryId && selectedOfferId !== null);
  const canProceedStep2 = customerName.trim().length > 0 && customerPhone.trim().length > 0;
  const canProceedStep3 = Boolean(
    selectedOffer && (paymentMethod === 'cash' || walletBalance >= selectedOffer.price),
  );

  const isPrimaryDisabled =
    (currentStep === 1 && !canProceedStep1)
    || (currentStep === 2 && !canProceedStep2)
    || (currentStep === 3 && (!canProceedStep3 || purchaseMutation.isPending));

  const shouldShowAutocomplete =
    currentStep === 1
    && showAutocomplete
    && searchQuery.trim().length > 0
    && filteredDestinations.length > 0;

  const handleBack = () => {
    setPurchaseError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      return;
    }
    const parent = navigation.getParent();
    if (parent) {
      (parent as any).navigate('DashboardTab', { screen: 'Dashboard' });
      return;
    }
    navigation.goBack();
  };

  const handleSelectDestination = (destination: Destination) => {
    setSearchQuery(destination.country);
    setShowAutocomplete(false);
    setSelectedCountryId(destination.country);
    setSelectedOfferId(null);
    setPurchaseError(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowAutocomplete(true);
    setPurchaseError(null);
    if (selectedCountryId) {
      setSelectedCountryId(null);
      setSelectedOfferId(null);
    }
  };

const handleConfirm = async () => {
  if (!selectedOffer) return;
  setPurchaseError(null);
  try {
    const result = await purchaseMutation.mutateAsync({
      offerId: selectedOffer.id,
      paymentMethod,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      activateNow,
    });

    const hasFailed =
      result.status === 'FAILED' ||
      result.message === 'WALLET_FAILED' ||
      result.message === 'PAYMENT_FAILED' ||
      result.message === 'QUEUE_FAILED';

    if (hasFailed) {
      setPurchaseError('La transaction a échoué. Veuillez réessayer.');
      return;
    }

    navigation.navigate('B2BSellSuccess', {
      transactionId: result.transactionId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      country: selectedCountryId!,
      offerTitle: selectedOffer.title,
      amount: selectedOffer.price,
      activateNow,
    });

  } catch {
    setPurchaseError('La transaction a échoué. Veuillez réessayer.');
  }
};

  const handlePrimaryAction = async () => {
    if (currentStep === 1) {
      if (canProceedStep1) {
        setCurrentStep(2);
        setShowAutocomplete(false);
      }
      return;
    }
    if (currentStep === 2) {
      if (canProceedStep2) setCurrentStep(3);
      return;
    }
    await handleConfirm();
  };

  const openWalletTab = () => {
    (navigation.getParent() as any)?.navigate('WalletTab', { screen: 'Wallet' });
  };

  // Bottom dock height — used to push content above it
  const bottomDockPadding = tabBarHeight + spacing.sm;
  const contentPaddingBottom = tabBarHeight + spacing.xxxxxl + spacing.xxxl;

  return (
    <ScreenShell>
      {/* 🔹 HEADER — matches HomeScreen pattern */}
      <ScreenHeader style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            accessibilityLabel="Retour"
            accessibilityRole="button"
            activeOpacity={0.85}
            onPress={handleBack}
            style={styles.iconButton}
          >
            <Ionicons color={colors.text.onPrimary} name="arrow-back" size={sizes.icon.md} />
          </TouchableOpacity>
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingSub}>Étape {currentStep} / {stepConfig.length}</Text>
            <Text style={styles.headerTitle}>Vendre un eSIM</Text>
          </View>
        </View>

        {/* Stepper — pill style on white header */}
        <View style={styles.stepperRow}>
          {stepConfig.map((step, index) => {
            const isCompleted = currentStep > step.value;
            const isActive = currentStep === step.value;
            const showLine = index < stepConfig.length - 1;
            return (
              <View key={step.value} style={styles.stepItemWrap}>
                <View style={styles.stepCircleLineRow}>
                  <View
                    style={[
                      styles.stepCircle,
                      isActive ? styles.stepCircleActive : isCompleted ? styles.stepCircleDone : styles.stepCircleInactive,
                    ]}
                  >
                    {isCompleted ? (
                      <Ionicons color={colors.text.onPrimary} name="checkmark" size={sizes.icon.xs} />
                    ) : (
                      <Text style={[styles.stepCircleText, isActive && styles.stepCircleTextActive]}>
                        {step.value}
                      </Text>
                    )}
                  </View>
                  {showLine ? (
                    <View style={[styles.stepLine, isCompleted ? styles.stepLineDone : undefined]} />
                  ) : null}
                </View>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{step.label}</Text>
              </View>
            );
          })}
        </View>
      </ScreenHeader>

      <ScreenContent
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: contentPaddingBottom },
        ]}
      >
        <View style={styles.pagePadding}>

          {/* ── STEP 1 ── */}
          {currentStep === 1 ? (
            <View>
              <Text style={styles.sectionTitle}>Selection du forfait</Text>

              <View style={styles.searchWrap}>
                <Ionicons
                  color={colors.text.tertiary}
                  name="search"
                  size={sizes.icon.sm}
                  style={styles.searchIcon}
                />
                <TextInput
                  onChangeText={handleSearchChange}
                  onFocus={() => setShowAutocomplete(true)}
                  placeholder="Rechercher une destination"
                  placeholderTextColor={colors.text.tertiary}
                  style={styles.searchInput}
                  value={searchQuery}
                />
              </View>

              {shouldShowAutocomplete ? (
                <View style={styles.autocompleteWrap}>
                  {filteredDestinations.map((destination) => (
                    <TouchableOpacity
                      key={`${destination.country}-${destination.Region}-${destination.id}`}
                      accessibilityRole="button"
                      activeOpacity={0.85}
                      onPress={() => handleSelectDestination(destination)}
                      style={styles.autocompleteItem}
                    >
                      <View style={styles.autocompleteItemLeft}>
                        <Text style={styles.autocompleteCountry}>{destination.country}</Text>
                        <Text style={styles.autocompleteRegion}>{destination.Region}</Text>
                      </View>
                      <Ionicons
                        color={colors.text.tertiary}
                        name="chevron-forward"
                        size={sizes.icon.xs}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              {selectedCountryId && offersQuery.isLoading ? (
                <View style={styles.stateCard}>
                  <ActivityIndicator color={colors.primary.DEFAULT} size="large" />
                  <Text style={styles.stateText}>Chargement des forfaits...</Text>
                </View>
              ) : null}

              {selectedCountryId && offersQuery.isError ? (
                <View style={styles.errorWrap}>
                  <ErrorBanner message="Impossible de charger les forfaits pour cette destination." />
                </View>
              ) : null}

              {selectedCountryId && !offersQuery.isLoading && !offersQuery.isError && offers.length === 0 ? (
                <View style={styles.stateCard}>
                  <Ionicons color={colors.text.tertiary} name="wifi-outline" size={sizes.icon.xl} />
                  <Text style={styles.stateText}>Aucun forfait disponible</Text>
                </View>
              ) : null}

              {selectedCountryId && !offersQuery.isLoading && !offersQuery.isError ? (
                <View style={styles.packagesWrap}>
                  {offers.map((offer) => {
                    const selected = selectedOfferId === offer.id;
                    return (
                      <TouchableOpacity
                        key={offer.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        activeOpacity={0.85}
                        onPress={() => setSelectedOfferId(offer.id)}
                        style={[
                          styles.offerCard,
                          selected ? styles.offerCardSelected : styles.offerCardUnselected,
                        ]}
                      >
                        <View style={styles.offerRow}>
                          <View style={styles.offerLeft}>
                            <Text style={styles.offerVolume}>{offer.dataVolume}</Text>
                            <Text style={styles.offerMeta}>
                              {`${offer.validityDays} jours - 4G/5G`}
                            </Text>
                          </View>
                          <View style={styles.offerRight}>
                            <Text style={styles.offerPrice}>
                              {formatCurrency(offer.price, offer.currency)}
                            </Text>
                            {selected ? (
                              <Ionicons
                                color={colors.primary.DEFAULT}
                                name="checkmark-circle"
                                size={sizes.icon.md}
                              />
                            ) : null}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>
          ) : null}

          {/* ── STEP 2 ── */}
          {currentStep === 2 ? (
            <View>
              <PackageSummaryCard offer={selectedOffer} selectedDestination={selectedDestination} />
              <Text style={styles.sectionTitle}>Informations client</Text>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Nom complet *</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    onChangeText={setCustomerName}
                    placeholder="Nom et prénom"
                    placeholderTextColor={colors.text.tertiary}
                    style={styles.inputText}
                    value={customerName}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Numéro de téléphone *</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    keyboardType="phone-pad"
                    onChangeText={setCustomerPhone}
                    placeholder="Ex: +216 00 000 000"
                    placeholderTextColor={colors.text.tertiary}
                    style={styles.inputText}
                    value={customerPhone}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setCustomerEmail}
                    placeholder="client@email.com"
                    placeholderTextColor={colors.text.tertiary}
                    style={styles.inputText}
                    value={customerEmail}
                  />
                </View>
              </View>

              <View style={styles.infoBanner}>
                <Ionicons
                  color={colors.primary.dark}
                  name="phone-portrait-outline"
                  size={sizes.icon.sm}
                />
                <Text style={styles.infoBannerText}>
                  Le QR code eSIM sera envoyé à ce numéro
                </Text>
              </View>
            </View>
          ) : null}

          {/* ── STEP 3 ── */}
          {currentStep === 3 ? (
            <View>
              <PackageSummaryCard offer={selectedOffer} selectedDestination={selectedDestination} />

              <View style={styles.orderCard}>
                <Text style={styles.cardTitle}>Résumé de commande</Text>
                <OrderRow
                  label="Destination"
                  value={selectedDestination?.country || selectedOffer?.country || '-'}
                />
                <OrderRow
                  label="Forfait"
                  value={
                    selectedOffer
                      ? `${selectedOffer.dataVolume} / ${selectedOffer.validityDays} jours`
                      : '-'
                  }
                />
                <OrderRow label="Client" value={customerName.trim() || '-'} />
                <OrderRow label="Téléphone" value={customerPhone.trim() || '-'} />
                <View style={styles.divider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    {selectedOffer
                      ? formatCurrency(selectedOffer.price, selectedOffer.currency)
                      : '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.walletCard}>
                <View style={styles.walletRow}>
                  <View style={styles.walletIconWrap}>
                    <Ionicons
                      color={colors.primary.DEFAULT}
                      name="wallet-outline"
                      size={sizes.icon.md}
                    />
                  </View>
                  <View style={styles.walletLeft}>
                    <Text style={styles.walletTitle}>Solde portefeuille</Text>
                    <Text style={styles.walletValue}>{formatCurrency(walletBalance)}</Text>
                  </View>
                </View>
                {selectedOffer && remainingBalance >= 0 ? (
                  <View style={styles.walletRemainingWrap}>
                    <Text style={styles.walletRemaining}>
                      {`Solde après achat : ${formatCurrency(remainingBalance)}`}
                    </Text>
                  </View>
                ) : null}
              </View>

              {selectedOffer && remainingBalance < 0 ? (
                <View style={styles.insufficientBalanceCard}>
                  <Text style={styles.walletWarningText}>
                    ⚠️ Solde insuffisant. Rechargez votre portefeuille.
                  </Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.85}
                    onPress={openWalletTab}
                  >
                    <Text style={styles.walletWarningLink}>Aller au portefeuille →</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.orderCard}>
                <Text style={styles.cardTitle}>Options d'activation</Text>
                <RadioOptionRow
                  label="Activer immédiatement"
                  selected={activateNow}
                  subtitle="Le client reçoit la ligne activée dès maintenant"
                  onPress={() => setActivateNow(true)}
                />
                <RadioOptionRow
                  label="Activer plus tard"
                  selected={!activateNow}
                  subtitle="Activation manuelle plus tard"
                  onPress={() => setActivateNow(false)}
                />
              </View>

              <View style={styles.orderCard}>
                <Text style={styles.cardTitle}>Méthode de paiement</Text>
                <RadioOptionRow
                  label="Payer depuis le portefeuille"
                  selected={paymentMethod === 'wallet'}
                  onPress={() => setPaymentMethod('wallet')}
                />
                <RadioOptionRow
                  label="Paiement en espèces"
                  selected={paymentMethod === 'cash'}
                  onPress={() => setPaymentMethod('cash')}
                />
              </View>

              {paymentMethod === 'cash' && selectedOffer ? (
                <View style={styles.cashBanner}>
                  <Text style={styles.cashBannerText}>
                    {`💵 Paiement en espèces — Veuillez encaisser ${formatCurrency(selectedOffer.price, selectedOffer.currency)} auprès du client.`}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

        </View>
      </ScreenContent>

      {/* Bottom dock — sits above tab bar */}
      <View
        style={[
          styles.bottomDock,
          { paddingBottom: bottomDockPadding },
        ]}
      >
        <View style={styles.actionsRow}>
          <OutlineButton
            disabled={purchaseMutation.isPending}
            label="Retour"
            onPress={handleBack}
          />
          <ActionButton
            disabled={isPrimaryDisabled}
            label={currentStep === 3 ? 'Valider' : 'Suivant'}
            loading={currentStep === 3 && purchaseMutation.isPending}
            onPress={() => { void handlePrimaryAction(); }}
            style={{ flex: 1 }}
          />
        </View>
        {purchaseError ? <ErrorBanner message={purchaseError} /> : null}
        {!purchaseError && purchaseMutation.isError ? (
          <ErrorBanner message="La transaction a echoue. Veuillez reessayer." />
        ) : null}
      </View>
    </ScreenShell>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

type PackageSummaryCardProps = {
  offer: Offer | null;
  selectedDestination: Destination | null;
};

const PackageSummaryCard = ({ offer, selectedDestination }: PackageSummaryCardProps) => {
  if (!offer) return null;
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTopRow}>
        <View style={styles.summaryIconWrap}>
          <Ionicons color={colors.primary.DEFAULT} name="globe-outline" size={sizes.icon.md} />
        </View>
        <View style={styles.summaryTextBlock}>
          <Text style={styles.summaryOverline}>Forfait selectionne</Text>
          <Text style={styles.summaryCountry}>
            {selectedDestination?.country || offer.country}
          </Text>
        </View>
        <Text style={styles.summaryPrice}>{formatCurrency(offer.price, offer.currency)}</Text>
      </View>
      <Text style={styles.summaryVolume}>{offer.dataVolume}</Text>
      <Text style={styles.summaryMeta}>{`${offer.validityDays} jours - 4G/5G`}</Text>
    </View>
  );
};

type OrderRowProps = { label: string; value: string };
const OrderRow = ({ label, value }: OrderRowProps) => (
  <View style={styles.orderRow}>
    <Text style={styles.orderLabel}>{label}</Text>
    <Text style={styles.orderValue}>{value}</Text>
  </View>
);

type RadioOptionRowProps = {
  label: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
};

const RadioOptionRow = ({ label, onPress, selected, subtitle }: RadioOptionRowProps) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityState={{ selected }}
    activeOpacity={0.85}
    onPress={onPress}
    style={[styles.radioOptionRow, selected ? styles.radioOptionRowSelected : undefined]}
  >
    <View style={[styles.radio, selected ? styles.radioSelected : undefined]}>
      {selected ? <View style={styles.radioDot} /> : null}
    </View>
    <View style={styles.radioOptionTextWrap}>
      <Text style={styles.radioOptionLabel}>{label}</Text>
      {subtitle ? <Text style={styles.radioOptionSubtitle}>{subtitle}</Text> : null}
    </View>
  </TouchableOpacity>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  /* ── HEADER — mirrors HomeScreen ── */
  header: {
    ...patterns.headerShell,
    backgroundColor: colors.primary.DEFAULT,
    borderBottomColor: colors.primary.dark,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  greetingBlock: {
    flex: 1,
  },
  greetingSub: {
    ...typography.bodySM,
    color: colors.state.onPrimaryOverlay80,
    fontWeight: '500',
    marginBottom: spacing.xxs,
  },
  headerTitle: {
    ...typography.titleLG,
    color: colors.text.onPrimary,
  },
  iconButton: {
    height: sizes.touch.sm,
    width: sizes.touch.sm,
    borderRadius: radii.full,
    backgroundColor: colors.state.onPrimaryOverlay18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...shadows.medium,
  },

  /* ── STEPPER — on white background ── */
  stepperRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  stepItemWrap: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircleLineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  stepCircle: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: sizes.avatar.sm,
    justifyContent: 'center',
    width: sizes.avatar.sm,
  },
  stepCircleActive: {
    backgroundColor: colors.white,
  },
  stepCircleDone: {
    backgroundColor: colors.success.DEFAULT,
  },
  stepCircleInactive: {
    backgroundColor: colors.state.onPrimaryOverlay25,
  },
  stepCircleText: {
    ...typography.labelSM,
    color: colors.white,
    fontWeight: '700',
  },
  stepCircleTextActive: {
    color: colors.primary.DEFAULT,
  },
  stepLine: {
    backgroundColor: colors.state.onPrimaryOverlay25,
    flex: 1,
    height: 2,
    marginHorizontal: spacing.xs,
  },
  stepLineDone: {
    backgroundColor: colors.success.DEFAULT,
  },
  stepLabel: {
    ...typography.bodySM,
    color: colors.state.onPrimaryOverlay60,
    marginTop: spacing.xs,
  },
  stepLabelActive: {
    color: colors.text.onPrimary,
    fontWeight: '700',
  },
  contentContainer: {
    paddingTop: spacing.lg,
  },
  pagePadding: {
    ...patterns.screenPadding,
  },
  sectionTitle: {
    ...typography.overline,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  searchWrap: {
    ...patterns.searchField,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    ...typography.bodyMD,
    color: colors.text.primary,
    flex: 1,
    paddingVertical: spacing[0],
  },
  autocompleteWrap: {
    ...patterns.card,
    marginTop: spacing.xs,
    padding: spacing[0],
  },
  autocompleteItem: {
    alignItems: 'center',
    borderBottomColor: colors.borderSubtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: sizes.touch.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  autocompleteItemLeft: {
    flex: 1,
  },
  autocompleteCountry: {
    ...typography.bodyMD,
    color: colors.text.primary,
    fontWeight: '600',
  },
  autocompleteRegion: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  stateCard: {
    ...patterns.card,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  stateText: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorWrap: {
    marginTop: spacing.md,
  },
  packagesWrap: {
    marginTop: spacing.lg,
  },
  offerCard: {
    borderRadius: radii.card,
    marginBottom: spacing.md,
    minHeight: sizes.card.minHeight,
    padding: spacing.lg,
    ...shadows.medium,
  },
  offerCardSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary.DEFAULT,
    borderWidth: 2,
  },
  offerCardUnselected: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderWidth: 1,
  },
  offerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  offerLeft: {
    flex: 1,
  },
  offerRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  offerVolume: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },
  offerMeta: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  offerPrice: {
    ...typography.titleSM,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  /* ── PACKAGE SUMMARY CARD — mirrors HomeScreen promoStrip ── */
  summaryCard: {
    ...patterns.card,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  summaryTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  summaryIconWrap: {
    width: sizes.iconWrap.sm,
    height: sizes.iconWrap.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  summaryTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  summaryOverline: {
    ...typography.overline,
    color: colors.text.secondary,
  },
  summaryCountry: {
    ...typography.labelMD,
    color: colors.text.primary,
    fontWeight: '700',
    marginTop: spacing.xxs,
  },
  summaryVolume: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },
  summaryMeta: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  summaryPrice: {
    ...typography.labelMD,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
    flexShrink: 0,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  inputWrap: {
    ...patterns.inputField,
  },
  inputText: {
    ...typography.bodyMD,
    color: colors.text.primary,
    flex: 1,
    paddingVertical: spacing[0],
  },
  infoBanner: {
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderColor: colors.primary.DEFAULT,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  infoBannerText: {
    ...typography.bodySM,
    color: colors.primary.dark,
    flex: 1,
    fontWeight: '600',
  },
  orderCard: {
    ...patterns.card,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  orderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  orderLabel: {
    ...typography.bodySM,
    color: colors.text.secondary,
  },
  orderValue: {
    ...typography.bodySM,
    color: colors.text.primary,
    flexShrink: 1,
    fontWeight: '600',
    marginLeft: spacing.md,
    textAlign: 'right',
  },
  divider: {
    backgroundColor: colors.divider,
    height: 1,
    marginVertical: spacing.sm,
  },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    ...typography.labelLG,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  totalValue: {
    ...typography.titleSM,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  walletCard: {
    ...patterns.card,
    flexDirection: 'column',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  walletRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  walletLeft: {
    flex: 1,
  },
  walletIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    borderRadius: radii.md,
    height: sizes.iconWrap.sm,
    justifyContent: 'center',
    width: sizes.iconWrap.sm,
    flexShrink: 0,
  },
  walletTitle: {
    ...typography.labelSM,
    color: colors.text.secondary,
  },
  walletValue: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '800',
    marginTop: spacing.xxs,
  },
  walletRemainingWrap: {
    backgroundColor: colors.success[50],
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  walletRemaining: {
    ...typography.bodySM,
    color: colors.success.dark,
    fontWeight: '600',
  },
  insufficientBalanceCard: {
    backgroundColor: colors.error[50],
    borderColor: colors.error.DEFAULT,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  walletWarningText: {
    ...typography.bodySM,
    color: colors.error.dark,
    fontWeight: '700',
  },
  walletWarningLink: {
    ...typography.bodySM,
    color: colors.text.link,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  cashBanner: {
    backgroundColor: colors.success[50],
    borderColor: colors.success.DEFAULT,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  cashBannerText: {
    ...typography.bodySM,
    color: colors.success.dark,
    fontWeight: '600',
  },
  radioOptionRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: sizes.touch.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  radioOptionRowSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary.DEFAULT,
  },
  radioOptionTextWrap: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  radioOptionLabel: {
    ...typography.bodyMD,
    color: colors.text.primary,
    fontWeight: '600',
  },
  radioOptionSubtitle: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  radio: {
    alignItems: 'center',
    borderColor: colors.gray[300],
    borderRadius: sizes.radio / 2,
    borderWidth: 2,
    height: sizes.radio,
    justifyContent: 'center',
    width: sizes.radio,
  },
  radioSelected: {
    borderColor: colors.primary.DEFAULT,
  },
  radioDot: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: sizes.radioInner / 2,
    height: sizes.radioInner,
    width: sizes.radioInner,
  },

  // Bottom dock — positioned above tab bar
  bottomDock: {
    ...patterns.actionBar,
    alignItems: 'stretch',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  actionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
});
