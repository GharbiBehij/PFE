import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut, SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { ActionButton, PurpleButton } from './Buttons';
import { useOffersByCountry } from '../hooks/client/useOffers';
import { colors, radii, shadows, spacing, typography } from '../theme';
import type { Esim } from '../types/esim';
import type { Offer } from '../types/offer';
import { useTopup } from '../hooks/client/usePayment';

interface Props {
  esim: Esim | null;
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onPayment?: (paymentUrl: string, transactionId: number, channel: 'B2C' | 'B2B2C') => void;
}

export const RechargeBottomSheet = ({ esim, visible, onClose, onConfirm, onPayment }: Props) => {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Offer | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Delay hiding the Modal so exit animation has time to play
  useEffect(() => {
    if (visible) {
      setIsVisible(true);
    } else {
      const t = setTimeout(() => setIsVisible(false), 320);
      return () => clearTimeout(t);
    }
  }, [visible]);

  const offersQuery = useOffersByCountry(esim?.country ?? '');
  const { mutateAsync: topup, isPending: isPaying } = useTopup();
  // Reset selection when sheet opens with a new esim
  useEffect(() => {
    if (visible) setSelected(null);
  }, [visible, esim?.id]);

const handleConfirm = useCallback(async () => {
  if (!selected || !esim) return;
  const result = await topup({
    esimId: String(esim.id),
    offerId: selected.id,
    paymentMethod: 'card',
  }) as any;
  onClose();
  if (result?.paymentUrl && result?.transactionId) {
    onPayment?.(result.paymentUrl, result.transactionId, result.channel ?? 'B2C');
  } else {
    onConfirm?.();
  }
}, [selected, esim, topup, onConfirm, onClose, onPayment]);

  const renderOffer = ({ item, index }: { item: Offer; index: number }) => {
    const isSelected = selected?.id === item.id;
    const priceLabel = `${item.price.toFixed(3)} TND`;
    const dataLabel = `${item.dataVolume} GB`;
    const daysLabel = `${item.validityDays} jours`;

    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(220)}>
        <Pressable
          onPress={() => setSelected(item)}
          style={[styles.card, isSelected && styles.cardSelected]}
        >
          {/* Selected indicator */}
          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>

          {/* Plan info */}
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{dataLabel}</Text>
            <View style={styles.cardMeta}>
              <View style={styles.pill}>
                <Ionicons name="time-outline" size={10} color={colors.text.secondary} />
                <Text style={styles.pillText}>{daysLabel}</Text>
              </View>
              {item.coverageType ? (
                <View style={styles.pill}>
                  <Ionicons name="globe-outline" size={10} color={colors.text.secondary} />
                  <Text style={styles.pillText}>{item.coverageType}</Text>
                </View>
              ) : null}
            </View>
            {item.description ? (
              <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
            ) : null}
          </View>

          {/* Price */}
          <View style={styles.cardPriceBlock}>
            <Text style={[styles.cardPrice, isSelected && styles.cardPriceSelected]}>
              {priceLabel}
            </Text>
            {isSelected && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>Sélectionné</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(280)}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      <Animated.View
        entering={SlideInUp.springify().damping(20).stiffness(180)}
        exiting={SlideOutDown.duration(300)}
        style={styles.sheet}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Recharger l'eSIM</Text>
            {esim?.country ? (
              <Text style={styles.headerSub}>{esim.country}</Text>
            ) : null}
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={18} color={colors.text.primary} />
          </Pressable>
        </View>

        {/* Offers list */}
        {offersQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary.DEFAULT} />
            <Text style={styles.loadingText}>Chargement des offres…</Text>
          </View>
        ) : offersQuery.isError ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.error.DEFAULT} />
            <Text style={styles.errorText}>Impossible de charger les offres.</Text>
            <PurpleButton
              label="Réessayer"
              onPress={() => offersQuery.refetch()}
              style={styles.retryBtn}
            />
          </View>
        ) : offersQuery.data?.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="cube-outline" size={32} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Aucune offre disponible pour cette destination.</Text>
          </View>
        ) : (
          <FlatList
            data={[...(offersQuery.data ?? [])].sort((a, b) => a.validityDays - b.validityDays)}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderOffer}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            style={styles.flatList}
          />
        )}

        {/* Footer CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.sm }]}>
          <ActionButton
            label={
              isPaying
                ? 'Rechargement...'
                : selected
                  ? `Recharger · ${selected.price.toFixed(3)} TND`
                  : 'Sélectionnez un forfait'
            }
            onPress={handleConfirm}
            disabled={!selected || isPaying}
            icon={selected && !isPaying ? 'arrow-forward' : undefined}
          />
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadows.high,
  },
  handle: {
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 16, fontWeight: '800', color: colors.text.primary,
  },
  headerSub: {
    fontSize: 12, fontWeight: '500', color: colors.text.secondary, marginTop: 2,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: radii.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center', justifyContent: 'center',
  },

  /* list */
  flatList: {
    flex: 1,
  },
  list: {
    padding: spacing.xl, gap: 10,
  },

  /* offer card */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: 14,
    ...shadows.medium,
  },
  cardSelected: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.primary[50] ?? '#EEF2FF',
  },
  radioOuter: {
    width: 20, height: 20, borderRadius: radii.full,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  radioOuterSelected: {
    borderColor: colors.primary.DEFAULT,
  },
  radioInner: {
    width: 10, height: 10, borderRadius: radii.full,
    backgroundColor: colors.primary.DEFAULT,
  },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: {
    fontSize: 17, fontWeight: '800', color: colors.text.primary,
  },
  cardMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  pillText: { fontSize: 10, fontWeight: '600', color: colors.text.secondary },
  cardDesc: {
    fontSize: 11, fontWeight: '500', color: colors.text.tertiary,
  },
  cardPriceBlock: { alignItems: 'flex-end', gap: 4 },
  cardPrice: {
    fontSize: 15, fontWeight: '800', color: colors.text.primary,
  },
  cardPriceSelected: { color: colors.primary.DEFAULT },
  selectedBadge: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  selectedBadgeText: {
    fontSize: 9, fontWeight: '700', color: '#fff',
  },

  /* states */
  center: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center',
    padding: spacing.xxl, gap: spacing.sm,
  },
  loadingText: { fontSize: 13, color: colors.text.secondary },
  errorText: {
    fontSize: 13, fontWeight: '600', color: colors.error.DEFAULT, textAlign: 'center',
  },
  emptyText: {
    fontSize: 13, color: colors.text.secondary, textAlign: 'center', maxWidth: 220,
  },
  retryBtn: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },

  /* footer */
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  confirmBtn: {},
});