import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionButton, OutlineButton } from '../../components/Buttons';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { PaymentWebViewModal } from '../../components/PaymentWebViewModal';
import { RechargeBottomSheet } from '../../components/RechargeBottomSheet';

import { UsageRing } from '../../components/UsageRing';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../components/layout';
import { useAuth } from '../../hooks/client/useAuth';
import { useActivateEsim } from '../../hooks/client/usePayment';
import { useUserEsims } from '../../hooks/client/useEsims';
import { useNotificationInbox } from '../../hooks/client/useNotificationInbox';
import { navigateTo } from '../../navigation/navigationRef';
import type { EsimsStackParamList } from '../../navigation/types';
import { colors, radii, shadows, sizes, spacing, typography } from '../../theme';
import type { Esim, EsimStatus } from '../../types/esim';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalizeCountryCode } from '../../utils/countryCode';
import { countryNameFr } from '../../utils/countryNameFr';

type Props = NativeStackScreenProps<EsimsStackParamList, 'MyEsims'>;
type TabKey = 'ACTIVE' | 'PENDING' | 'HISTORY';

const ACTIVE_STATUSES = new Set<EsimStatus>(['ACTIVE']);
const PENDING_STATUSES = new Set<EsimStatus>(['NOT_ACTIVE']);
const UNLIMITED_SENTINEL = 999_999;

const getDaysRemaining = (expiryDate?: string): number | null => {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const getPlanLabel = (esim: Esim, fallbackTotal: number): string => {
  const gb = esim.offer?.dataVolume ?? null;
  const days = esim.offer?.validityDays ?? null;
  const isUnlimited =
    fallbackTotal >= UNLIMITED_SENTINEL ||
    (gb !== null && Number(gb) >= UNLIMITED_SENTINEL);
  if (isUnlimited && days) return `Illimité · ${days} jours`;
  if (isUnlimited) return 'Illimité';
  if (gb && days) return `${gb} · ${days} jours`;
  if (gb) return `${gb}`;
  if (days) return `${days} jours`;
  return fallbackTotal >= 1024 ? `${(fallbackTotal / 1024).toFixed(0)} GB` : `${fallbackTotal} MB`;
};

/* ─── FlagBox ───────────────────────────────────────────────── */
const FlagBox = ({ code }: { code: string }) => {
  const [flagFailed, setFlagFailed] = useState(false);
  const iso = normalizeCountryCode(code);
  useEffect(() => { setFlagFailed(false); }, [iso]);
  return (
    <View style={styles.flagBox}>
      {flagFailed || !iso ? (
        <View style={styles.flagFallback}>
          <Text style={styles.flagFallbackText}>{(iso || code || '').slice(0, 2).toUpperCase()}</Text>
        </View>
      ) : (
        <Image
          source={{ uri: `https://flagcdn.com/w160/${iso.toLowerCase()}.png` }}
          style={styles.flagImage}
          onError={() => setFlagFailed(true)}
        />
      )}
    </View>
  );
};

/* ─── StatusBadge ───────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: EsimStatus }) => {
  if (status === 'ACTIVE') {
    return (
      <View style={[styles.statusBadge, styles.statusBadgeActive]}>
        <Text style={[styles.statusText, styles.statusTextActive]}>Active</Text>
      </View>
    );
  }
  if (status === 'NOT_ACTIVE') {
    return (
      <View style={[styles.statusBadge, styles.statusBadgePending]}>
        <Text style={[styles.statusText, styles.statusTextPending]}>À activer</Text>
      </View>
    );
  }
  return (
    <View style={[styles.statusBadge, styles.statusBadgeExpired]}>
      <Text style={[styles.statusText, styles.statusTextExpired]}>Expirée</Text>
    </View>
  );
};

/* ─── MyEsimsScreen ─────────────────────────────────────────── */
export const MyEsimsScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<TabKey>(route.params?.initialTab ?? 'ACTIVE');

  useEffect(() => {
    if (route.params?.initialTab) {
      setSelectedTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  const activateEsim = useActivateEsim();
  const [showNotifications, setShowNotifications] = useState(false);
  const [rechargeEsim, setRechargeEsim] = useState<Esim | null>(null);
  const [paymentData, setPaymentData] = useState<{
    paymentUrl: string; transactionId: number; channel: 'B2C' | 'B2B2C';
  } | null>(null);
  const inbox = useNotificationInbox();
  const esimsQuery = useUserEsims(true);
  const allEsims = Array.isArray(esimsQuery.data) ? esimsQuery.data : [];

  useFocusEffect(useCallback(() => { void esimsQuery.refetch(); }, [esimsQuery.refetch]));

  const active  = useMemo(() => allEsims.filter(e => ACTIVE_STATUSES.has(e.status)), [allEsims]);
  const pending = useMemo(() => allEsims.filter(e => PENDING_STATUSES.has(e.status)), [allEsims]);
  const history = useMemo(() => allEsims.filter(e =>
    !ACTIVE_STATUSES.has(e.status) && !PENDING_STATUSES.has(e.status)), [allEsims]);

  // Auto-switch quand une eSIM change de statut
  const prevActiveCount  = useRef(active.length);
  const prevPendingCount = useRef(pending.length);
  const prevHistoryCount = useRef(history.length);
  useEffect(() => {
    const pa = prevActiveCount.current;
    const pp = prevPendingCount.current;
    const ph = prevHistoryCount.current;

    // PENDING → ACTIVE : dès qu'une eSIM est activée
    if (selectedTab === 'PENDING' && pending.length < pp && active.length > pa) {
      setSelectedTab('ACTIVE');
    }
    // ACTIVE → HISTORY : dès qu'une eSIM expire
    if (selectedTab === 'ACTIVE' && active.length < pa && history.length > ph) {
      setSelectedTab('HISTORY');
    }

    prevActiveCount.current  = active.length;
    prevPendingCount.current = pending.length;
    prevHistoryCount.current = history.length;
  }, [active.length, pending.length, history.length, selectedTab]);

  const list = useMemo(() => {
    if (selectedTab === 'ACTIVE') return active;
    if (selectedTab === 'PENDING') return pending;
    return history;
  }, [selectedTab, active, pending, history]);

  const totalRemainingMb = useMemo(() =>
    active.reduce((s, e) => s + Math.max((e.dataTotal ?? 0) - (e.dataUsed ?? 0), 0), 0), [active]);
  const totalCapMb = useMemo(() =>
    active.reduce((s, e) => s + (e.dataTotal ?? 0), 0), [active]);
  const pctRemaining = totalCapMb > 0 ? (totalRemainingMb / totalCapMb) * 100 : 0;
  const totalRemainingGb = (totalRemainingMb / 1000).toFixed(1);

  const nextExpDays = useMemo(() => {
    const days = active.map(e => getDaysRemaining(e.expiryDate)).filter((d): d is number => d !== null);
    return days.length > 0 ? Math.min(...days) : null;
  }, [active]);

  const urgentCount = useMemo(() => active.filter(e => {
    const d = getDaysRemaining(e.expiryDate);
    return d !== null && d <= 7;
  }).length, [active]);

  const openBrowse = () => navigation.getParent()?.navigate('HomeTab' as never);
  const handleTabChange = useCallback((next: TabKey) => {
    if (next !== selectedTab) setSelectedTab(next);
  }, [selectedTab]);

  // ── Guest view ───────────────────────────────────────────────
  if (!user) {
    return (
      <ScreenShell>
        <ScreenHeader style={styles.guestHeader}>
          <Text style={styles.guestHeaderTitle}>Mes eSIMs</Text>
        </ScreenHeader>
        <View style={styles.guestRoot}>
          <Ionicons name="globe-outline" size={72} color={colors.primary.DEFAULT} style={styles.guestIcon} />
          <Text style={styles.guestTitle}>Vos eSIMs apparaîtront ici</Text>
          <Text style={styles.guestSubtitle}>
            Connectez-vous pour accéder à vos eSIMs et suivre votre consommation de données.
          </Text>
          <ActionButton
            label="Se connecter"
            icon="log-in-outline"
            onPress={() => navigateTo('Login', { source: 'app' })}
          />
          <Pressable
            onPress={() => navigateTo('Register', { source: 'app' })}
            style={styles.guestRegisterLink}>
            <Text style={styles.guestRegisterText}>
              Pas encore de compte ? <Text style={styles.guestRegisterAccent}>Créer un compte</Text>
            </Text>
          </Pressable>
        </View>
      </ScreenShell>
    );
  }

  // ── renderItem ───────────────────────────────────────────────
  const renderItem = ({ item, index }: { item: Esim; index: number }) => {
    const used = item.dataUsed ?? 0;
    const total = item.dataTotal ?? 1;
    const pct = (used / Math.max(total, 1)) * 100;
    const remaining = Math.max(0, total - used);
    const daysLeft = getDaysRemaining(item.expiryDate);
    const isActive = ACTIVE_STATUSES.has(item.status);
    const isPending = PENDING_STATUSES.has(item.status);
    const isExpired = !isActive && !isPending;
    const isLow = pct >= 80 && isActive;
    const urgent = isActive && daysLeft !== null && daysLeft <= 7;

    const planLabel = getPlanLabel(item, total);
    const countryLabel = countryNameFr(item.countryCode, item.country);

    const progressColor = isExpired ? colors.text.tertiary
      : isPending ? colors.secondary.DEFAULT
      : isLow ? colors.error.DEFAULT
      : colors.primary.DEFAULT;

    const rightLabel = isPending ? 'Prêt à être activé'
      : isExpired ? 'Votre offre a expiré'
      : `${(remaining / 1000).toFixed(1)} GB restants`;

    const progressWidth = `${Math.max(pct < 2 && pct > 0 ? 2 : Math.min(pct, 100), 0)}%` as `${number}%`;

    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 5) * 50).duration(250)} style={styles.cardWrapper}>
        <Pressable
          onPress={() => navigation.navigate('EsimConsumption', { esimId: item.id })}
          style={({ pressed }) => [
            styles.card,
            urgent && styles.cardUrgent,
            isExpired && styles.cardExpired,
            isPending && styles.cardPending,
            pressed && styles.cardPressed,
          ]}
        >
          {/* ── Top row: flag + name + badge ── */}
          <View style={styles.cardTopRow}>
            <FlagBox code={item.countryCode ?? ''} />
            <View style={styles.cardTitleBlock}>
              <Text style={styles.cardName} numberOfLines={1}>{countryLabel}</Text>
              <Text style={styles.cardPlan}>{planLabel}</Text>
            </View>
            <View style={styles.cardBadgeBlock}>
              <StatusBadge status={item.status} />
              {urgent && daysLeft !== null ? (
                <View style={styles.dangerBadge}>
                  <Text style={styles.dangerBadgeText}>
                    {daysLeft === 0 ? 'Offre expirée' : `Offre · ${daysLeft}j`}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── Data row + progress bar ── */}
          <View style={styles.cardDataRow}>
            <Text style={styles.cardDataLeft}>
              {(used / 1000).toFixed(1)}
              <Text style={styles.cardDataTotal}> / {(total / 1000).toFixed(0)} GB</Text>
            </Text>
            <Text style={[styles.cardDataRight, isLow && styles.cardDataRightLow]}>
              {rightLabel}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth, backgroundColor: progressColor }]} />
          </View>

          {/* ── Action buttons ── */}
          {isActive ? (
            <View style={styles.actionsRow}>
              <OutlineButton
                size="sm"
                icon="stats-chart"
                label="Détails"
                onPress={() => navigation.navigate('EsimConsumption', { esimId: item.id })}
              />
              <ActionButton
                size="sm"
                icon="refresh"
                label="Recharger"
                style={{ flex: 1 }}
                onPress={() => setRechargeEsim(item)}
              />
            </View>
          ) : null}

          {isPending ? (
            <ActionButton
              size="sm"
              icon="flash-outline"
              label="Activer cette eSIM"
              loading={activateEsim.isPending}
              style={{ marginTop: spacing.md }}
              onPress={() => {
                if (!item.transactionId) return;
                activateEsim.mutate(String(item.transactionId), {
                  onSuccess: () => {
                    navigation.getParent()?.navigate('HomeTab', {
                      screen: 'ProcessingModal',
                      params: { transactionId: Number(item.transactionId), channel: 'B2C' },
                    });
                  },
                });
              }}
            />
          ) : null}

          {isExpired ? (
            <ActionButton
              size="sm"
              icon="refresh"
              label="Recharger"
              style={{ marginTop: spacing.md }}
              onPress={() => setRechargeEsim(item)}
            />
          ) : null}
        </Pressable>
      </Animated.View>
    );
  };

  // ── Empty states ─────────────────────────────────────────────
  const renderEmpty = () => {
    if (esimsQuery.isLoading) return (
      <View style={styles.loadingWrap}><LoadingOverlay fullScreen={false} /></View>
    );
    if (esimsQuery.isError) return (
      <View style={styles.errorWrap}>
        <ErrorBanner message="Impossible de charger vos eSIMs." onRetry={() => esimsQuery.refetch()} />
      </View>
    );
    if (selectedTab === 'PENDING') return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconCircle}>
          <Ionicons color={colors.primary.DEFAULT} name="apps-outline" size={sizes.icon.lg} />
        </View>
        <Text style={styles.emptyTitle}>Aucune eSIM en attente</Text>
      </View>
    );
    if (selectedTab === 'HISTORY') return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconCircle}>
          <Ionicons color={colors.primary.DEFAULT} name="time-outline" size={sizes.icon.lg} />
        </View>
        <Text style={styles.emptyTitle}>Aucun historique</Text>
        <ActionButton
          size="sm"
          icon="compass-outline"
          label="Parcourir les offres"
          style={{ marginTop: spacing.sm }}
          onPress={openBrowse}
        />
      </View>
    );
    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconCircle}>
          <Ionicons color={colors.primary.DEFAULT} name="planet-outline" size={sizes.icon.lg} />
        </View>
        <Text style={styles.emptyTitle}>Aucune eSIM active</Text>
        <ActionButton
          size="sm"
          icon="compass-outline"
          label="Parcourir les offres"
          style={{ marginTop: spacing.sm }}
          onPress={openBrowse}
        />
      </View>
    );
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <ScreenShell>
      {/* ── Hero gradient ── */}
      <LinearGradient
        colors={[colors.primary.dark, colors.primary.DEFAULT]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 8 }]}
      >
        {/* single orb — matches showcase exactly */}
        <View style={styles.heroOrb} />

        {/* top row */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.heroOverline}>TABLEAU DE BORD</Text>
            <Text style={styles.heroTitle}>Mes eSIMs</Text>
          </View>
          <Pressable
            onPress={() => {
              if (!showNotifications) void inbox.markRead();
              setShowNotifications(v => !v);
            }}
            style={({ pressed }) => [styles.bellBtn, pressed && styles.bellBtnPressed]}
          >
            <Ionicons name="notifications-outline" size={18} color="#fff" />
            {inbox.unreadCount > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{inbox.unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* aggregate panel */}
        {active.length > 0 ? (
          <View style={styles.aggregate}>
            <UsageRing
              percent={pctRemaining} size={68} stroke={7}
              color={colors.white} track={colors.state.onPrimaryOverlay20}
              centerTop={`${Math.round(pctRemaining)}%`}
              centerTopStyle={styles.aggRingValue}
            />
            <View style={styles.aggregateInfo}>
              <Text style={styles.aggOverline}>DATA RESTANTE</Text>
              <Text style={styles.aggValue}>
                {totalRemainingGb}<Text style={styles.aggUnit}> GB</Text>
              </Text>
              <Text style={styles.aggSub}>
                {`sur ${active.length} eSIM${active.length > 1 ? 's' : ''} active${active.length > 1 ? 's' : ''}`}
                {nextExpDays !== null ? ` · expire dans ${nextExpDays} j` : ''}
              </Text>
            </View>
          </View>
        ) : (
          <Pressable onPress={openBrowse}
            style={({ pressed }) => [styles.heroOutlineCta, pressed && styles.heroOutlineCtaPressed]}>
            <Ionicons name="cart-outline" size={18} color={colors.white} />
            <Text style={styles.heroOutlineCtaText}>Acheter votre première eSIM</Text>
          </Pressable>
        )}
      </LinearGradient>

      <ScreenContent scrollable={false}>
        {/* ── Tab bar ── */}
        <View style={styles.tabBar}>
          {([
            ['ACTIVE',  `Actives (${active.length})`],
            ['PENDING', `À activer (${pending.length})`],
            ['HISTORY', `Historique (${history.length})`],
          ] as const).map(([key, label]) => {
            const on = selectedTab === key;
            return (
              <Pressable key={key} onPress={() => handleTabChange(key)}
                style={[styles.tabPill, on && styles.tabPillOn]}>
                <Text style={[styles.tabText, on && styles.tabTextOn]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Urgent banner ── */}
        {urgentCount > 0 ? (
          <View style={styles.urgentBanner}>
            <View style={styles.urgentIconBox}>
              <Ionicons name="alert-circle" size={14} color={colors.error.DEFAULT} />
            </View>
            <Text style={styles.urgentText}>
              {nextExpDays === 0
                ? 'Votre offre a expiré · Renouvelez votre forfait'
                : `Votre offre expire dans ${nextExpDays} jour${nextExpDays !== 1 ? 's' : ''} · Renouvelez votre forfait`}
            </Text>
          </View>
        ) : null}

        {/* ── Card list ── */}
        <FlatList
          contentContainerStyle={styles.listContent}
          data={esimsQuery.isError || esimsQuery.isLoading ? [] : list}
          keyExtractor={(it, index) => `${it.id}-${index}`}
          ListEmptyComponent={renderEmpty}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      </ScreenContent>

      {/* ── Recharge bottom sheet (eSIMs expirées) ── */}
      <RechargeBottomSheet
        esim={rechargeEsim}
        visible={rechargeEsim !== null}
        onClose={() => setRechargeEsim(null)}
        onPayment={(paymentUrl, transactionId, channel) => {
          setRechargeEsim(null);
          setPaymentData({ paymentUrl, transactionId, channel });
        }}
      />

      {paymentData ? (
        <PaymentWebViewModal
          visible
          paymentUrl={paymentData.paymentUrl}
          transactionId={paymentData.transactionId}
          onClose={() => setPaymentData(null)}
          onSuccess={(txId) => {
            setPaymentData(null);
            (navigation.getParent() as any)?.navigate('HomeTab', {
              screen: 'ProcessingModal',
              params: { transactionId: txId, channel: paymentData.channel, mode: 'topup', esimId: String(paymentData.transactionId) },
            });
          }}
          onFailed={(txId) => {
            setPaymentData(null);
            (navigation.getParent() as any)?.navigate('HomeTab', {
              screen: 'EsimFailed',
              params: { transactionId: txId },
            });
          }}
        />
      ) : null}

      {/* ── Notifications dropdown ── */}
      {showNotifications && (
        <>
          <Pressable
            style={styles.notifBackdrop}
            onPress={() => setShowNotifications(false)}
          />
          <View style={[styles.notifDropdown, { top: insets.top + 56 }]}>
            <Text style={styles.notifDropdownTitle}>Notifications</Text>
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {inbox.items.length === 0 ? (
                <Text style={styles.notifEmpty}>Aucune notification pour le moment.</Text>
              ) : inbox.items.map((item, i) => (
                <View key={`${item.id}-${i}`}>
                  <View style={styles.notifItem}>
                    <Text style={styles.notifItemTitle}>{item.title}</Text>
                    <Text style={styles.notifItemBody}>{item.body}</Text>
                  </View>
                  {i < inbox.items.length - 1 && <View style={styles.notifDivider} />}
                </View>
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  /* ── hero ─────────────────────────────────────────────────── */
  hero: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radii.hero,
    borderBottomRightRadius: radii.hero,
    overflow: 'hidden',
    position: 'relative',
  },
  /* single orb — matches showcase (top:-30, right:-30, 120×120, opacity:0.08) */
  heroOrb: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: sizes.decoration.headerOrb,
    height: sizes.decoration.headerOrb,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    opacity: 0.08,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  heroOverline: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.state.onPrimaryOverlay70,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    marginTop: spacing.xs,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.state.onPrimaryOverlay18,
    borderWidth: 1,
    borderColor: colors.state.onPrimaryOverlay25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBtnPressed: { transform: [{ scale: 0.98 }] },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error.DEFAULT,
    borderWidth: 1.5,
    borderColor: colors.primary.dark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { fontSize: 9, fontWeight: '700', color: colors.white },

  /* ── aggregate panel ───────────────────────────────────────── */
  aggregate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.state.onPrimaryOverlay12,
    borderWidth: 1,
    borderColor: colors.state.onPrimaryOverlay20,
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  aggregateInfo: { flex: 1 },
  aggOverline: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.state.onPrimaryOverlay70,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  aggValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    marginTop: spacing.xxs,
  },
  aggUnit: { fontSize: 13, fontWeight: '700', color: colors.state.onPrimaryOverlay70 },
  aggSub: { fontSize: 11, fontWeight: '600', color: colors.state.onPrimaryOverlay70, marginTop: spacing.xs },
  aggRingValue: { fontSize: 15, fontWeight: '800', color: colors.white },
  heroOutlineCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.state.onPrimaryOverlay20,
    backgroundColor: colors.state.onPrimaryOverlay12,
    minHeight: 54,
  },
  heroOutlineCtaPressed: { transform: [{ scale: 0.98 }] },
  heroOutlineCtaText: { fontSize: 13, fontWeight: '800', color: colors.white },

  /* ── tab bar ───────────────────────────────────────────────── */
  tabBar: {
    flexDirection: 'row',
    gap: 2,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    padding: 3,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  tabPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.full,
    alignItems: 'center',
  },
  tabPillOn: {
    backgroundColor: colors.white,
    ...shadows.medium,
  },
  tabText: { fontSize: 11, fontWeight: '700', color: colors.text.secondary },
  tabTextOn: { color: colors.primary.DEFAULT },

  /* ── urgent banner ─────────────────────────────────────────── */
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[100],
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  urgentIconBox: {
    width: sizes.iconWrap.xs,
    height: sizes.iconWrap.xs,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.error[100],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  urgentText: { flex: 1, fontSize: 11, fontWeight: '600', color: colors.error.DEFAULT, lineHeight: 15 },

  /* ── list ──────────────────────────────────────────────────── */
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  /* ── card ──────────────────────────────────────────────────── */
  cardWrapper: {
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.mdPlus,
    ...shadows.medium,
  },
  cardPressed: { transform: [{ scale: 0.98 }] },
  cardExpired: { opacity: 0.78 },
  cardPending: {},
  cardUrgent: {
    borderColor: colors.error[100],
    borderLeftWidth: 4,
    borderLeftColor: colors.error.DEFAULT,
  },

  /* flag box */
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  flagBox: {
    width: sizes.touch.sm,
    height: sizes.touch.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  flagImage: { width: 28, height: 21, borderRadius: radii.xs },
  flagFallback: {
    width: 28,
    height: 21,
    borderRadius: radii.xs,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagFallbackText: { fontSize: 11, fontWeight: '700', color: colors.text.secondary },

  /* title + plan */
  cardTitleBlock: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  cardPlan: { fontSize: 11, fontWeight: '500', color: colors.text.secondary, marginTop: 2 },

  /* badge column */
  cardBadgeBlock: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { borderRadius: radii.full, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, borderWidth: 1 },
  statusBadgeActive:  { backgroundColor: colors.status.active.background, borderColor: colors.status.active.border },
  statusBadgePending: { backgroundColor: colors.status.inactive.background, borderColor: colors.status.inactive.border },
  statusBadgeExpired: { backgroundColor: colors.status.expired.background, borderColor: colors.status.expired.border },
  statusText: { fontSize: 10, fontWeight: '700' },
  statusTextActive:  { color: colors.status.active.text },
  statusTextPending: { color: colors.status.inactive.text },
  statusTextExpired: { color: colors.status.expired.text },
  dangerBadge: {
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[100],
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  dangerBadgeText: { fontSize: 10, fontWeight: '700', color: colors.error.DEFAULT },

  /* data row + progress */
  cardDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  cardDataLeft: { fontSize: 12, fontWeight: '700', color: colors.text.primary },
  cardDataTotal: { fontWeight: '500', color: colors.text.secondary },
  cardDataRight: { fontSize: 11, fontWeight: '500', color: colors.text.secondary },
  cardDataRightLow: { fontWeight: '700', color: colors.error.DEFAULT },
  progressTrack: { height: sizes.progressBar.height, borderRadius: sizes.progressBar.height, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%' },

  /* ── inline action buttons ──────────────────────────────────── */
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.mdPlus,
  },

  /* ── empty states ──────────────────────────────────────────── */
  /* padding:28 — matches showcase (not patterns.card padding:16) */
  emptyCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: 28,
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.medium,
  },
  emptyIconCircle: {
    width: sizes.touch.lg,
    height: sizes.touch.lg,
    borderRadius: radii.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  loadingWrap: { marginTop: spacing.xl, alignItems: 'center' },
  errorWrap: { marginTop: spacing.xl, alignSelf: 'stretch' },

  /* ── guest view ────────────────────────────────────────────── */
  guestHeader: { borderBottomLeftRadius: radii.xl, borderBottomRightRadius: radii.xl },
  guestHeaderTitle: { ...typography.titleSM, color: colors.text.primary, fontWeight: '800' },
  guestRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  guestIcon: { marginBottom: spacing.md, opacity: 0.9 },
  guestTitle: { fontSize: 22, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  guestSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  guestRegisterLink: { paddingVertical: spacing.sm, marginTop: spacing.md },
  guestRegisterText: { fontSize: 14, color: colors.text.secondary, textAlign: 'center' },
  guestRegisterAccent: { color: colors.primary.DEFAULT, fontWeight: '700' },

  /* ── notification dropdown ─────────────────────────────────── */
  notifBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99,
  },
  notifDropdown: {
    position: 'absolute',
    right: spacing.xl,
    width: 300,
    maxHeight: 320,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 100,
    ...shadows.high,
    overflow: 'hidden',
  },
  notifDropdownTitle: {
    ...typography.labelMD,
    color: colors.text.primary,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notifItem: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  notifItemTitle: { ...typography.labelSM, color: colors.text.primary, fontWeight: '600', marginBottom: 2 },
  notifItemBody: { ...typography.bodySM, color: colors.text.secondary, lineHeight: 18 },
  notifDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  notifEmpty: { ...typography.bodySM, color: colors.text.tertiary, textAlign: 'center', padding: spacing.xl },
});
