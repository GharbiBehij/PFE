import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ScreenHeader,
  ScreenShell,
} from '../../components/layout';
import { useAuth } from '../../hooks/client/useAuth';
import { useContactSupport } from '../../hooks/client/useContactSupport';
import type { ProfileStackParamList } from '../../navigation/types';
import {
  colors,
  patterns,
  radii,
  shadows,
  sizes,
  spacing,
  typography,
} from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'HelpCenter'>;
type ContactView = 'choice' | 'email' | 'success';

const FAQ_ITEMS = [
  {
    id: '1',
    question: 'Comment activer mon eSIM ?',
    answer:
      'Scannez le QR code reçu par email avec l\'appareil photo de votre téléphone, puis suivez les instructions à l\'écran.',
  },
  {
    id: '2',
    question: 'Dans quels pays mon forfait fonctionne-t-il ?',
    answer:
      'Cela dépend du type de forfait choisi. Les forfaits locaux couvrent un seul pays, les forfaits régionaux couvrent une zone géographique, et les forfaits mondiaux sont valables dans de nombreux pays.',
  },
  {
    id: '3',
    question: 'Comment recharger mon forfait ?',
    answer:
      'Depuis votre eSIM active dans "Mes eSIMs", appuyez sur "Recharger". Choisissez un forfait disponible pour votre destination et procédez au paiement.',
  },
  {
    id: '4',
    question: 'Politique de remboursement',
    answer:
      'Les remboursements sont possibles si le forfait n\'a pas encore été activé. Contactez notre support dans les 24h suivant l\'achat pour toute demande.',
  },
  {
    id: '5',
    question: 'Mon eSIM ne fonctionne pas à destination',
    answer:
      'Vérifiez que votre téléphone est déverrouillé et compatible eSIM. Assurez-vous que l\'eSIM est activée dans vos paramètres réseau. Redémarrez votre appareil après activation.',
  },
  {
    id: '6',
    question: 'Quels téléphones sont compatibles eSIM ?',
    answer:
      'La plupart des iPhones depuis XS (2018), les Samsung Galaxy S20+, Google Pixel 3+ et de nombreux autres appareils récents. Vérifiez les spécifications de votre téléphone.',
  },
];

const SUGGESTED = ['Activer mon eSIM', 'Pas de réseau', 'Recharger', 'Remboursement'];
const WHATSAPP_NUMBER = '21626497904';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
const SUPPORT_EMAIL = 'support@netyfly.tn';

export const HelpCenterScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const contactMutation = useContactSupport();

  const [openFaqId, setOpenFaqId] = useState<string>('1'); // first open by default
  const [contactView, setContactView] = useState<ContactView>('choice');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const switchContactView = (next: ContactView) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setContactView(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  const handleOpenWhatsApp = async () => {
    await Linking.openURL(WHATSAPP_URL);
  };

  const handleSendEmail = async () => {
    setFormError(null);
    if (!subject.trim()) {
      setFormError('Veuillez entrer un sujet.');
      return;
    }
    if (message.trim().length < 10) {
      setFormError('Le message doit contenir au moins 10 caractères.');
      return;
    }
    try {
      await contactMutation.mutateAsync({ subject: subject.trim(), message: message.trim() });
      switchContactView('success');
      setTimeout(() => {
        setSubject('');
        setMessage('');
        switchContactView('choice');
      }, 3000);
    } catch {
      setFormError("Erreur lors de l'envoi. Veuillez réessayer.");
    }
  };

  const renderContactBody = () => {
    switch (contactView) {
      case 'choice':
        return (
          <View style={styles.contactCard}>
            {/* WhatsApp row */}
            <Pressable
              onPress={handleOpenWhatsApp}
              style={({ pressed }) => [styles.contactRow, pressed && styles.contactRowPressed]}
            >
              <View style={[styles.contactIconWrap, styles.contactIconWa]}>
                <Ionicons name="logo-whatsapp" size={sizes.icon.md} color="#fff" />
              </View>
              <View style={styles.contactRowText}>
                <View style={styles.contactRowLabelRow}>
                  <Text style={styles.contactRowLabel}>WhatsApp</Text>
                  <View style={styles.onlineBadge}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineBadgeText}>En ligne</Text>
                  </View>
                </View>
                <Text style={styles.contactRowSub}>Réponse en ~5 min</Text>
              </View>
              <Ionicons name="chevron-forward" size={sizes.icon.sm} color={colors.text.tertiary} />
            </Pressable>

            <View style={styles.contactDivider} />

            {/* Email row */}
            <Pressable
              onPress={() => switchContactView('email')}
              style={({ pressed }) => [styles.contactRow, pressed && styles.contactRowPressed]}
            >
              <View style={[styles.contactIconWrap, styles.contactIconEmail]}>
                <Ionicons name="mail-outline" size={sizes.icon.md} color="#fff" />
              </View>
              <View style={styles.contactRowText}>
                <Text style={styles.contactRowLabel}>Email</Text>
                <Text style={styles.contactRowSub}>{SUPPORT_EMAIL} · sous 24 h</Text>
              </View>
              <Ionicons name="chevron-forward" size={sizes.icon.sm} color={colors.text.tertiary} />
            </Pressable>
          </View>
        );

      case 'email':
        return (
          <View style={styles.contactCard}>
            <Pressable
              onPress={() => switchContactView('choice')}
              style={styles.backLink}
            >
              <Ionicons name="arrow-back" size={sizes.icon.sm} color={colors.primary.DEFAULT} />
              <Text style={styles.backLinkText}>Choisir une autre option</Text>
            </Pressable>

            <View style={styles.emailIconWrap}>
              <Ionicons name="mail-outline" size={40} color={colors.primary.DEFAULT} />
            </View>
            <Text style={styles.emailTitle}>Envoyer un message</Text>
            <Text style={styles.emailSubtitle}>
              Notre équipe vous répondra sous 24 h à{' '}
              <Text style={styles.emailHighlight}>{user?.email}</Text>
            </Text>

            {formError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Sujet</Text>
              <TextInput
                onChangeText={setSubject}
                placeholder="Ex : Problème d'activation eSIM"
                placeholderTextColor={colors.text.tertiary}
                style={styles.input}
                value={subject}
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                multiline
                numberOfLines={4}
                onChangeText={setMessage}
                placeholder="Décrivez votre problème..."
                placeholderTextColor={colors.text.tertiary}
                style={[styles.input, styles.inputMultiline]}
                textAlignVertical="top"
                value={message}
              />
            </View>

            <Pressable
              disabled={contactMutation.isPending}
              onPress={handleSendEmail}
              style={({ pressed }) => [
                styles.sendButton,
                pressed && styles.sendButtonPressed,
                contactMutation.isPending && styles.sendButtonDisabled,
              ]}
            >
              <Ionicons name="send-outline" size={18} color={colors.white} />
              <Text style={styles.sendButtonText}>
                {contactMutation.isPending ? 'Envoi en cours…' : 'Envoyer'}
              </Text>
            </Pressable>
          </View>
        );

      case 'success':
        return (
          <View style={[styles.contactCard, styles.successCard]}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success.DEFAULT} />
            </View>
            <Text style={styles.emailTitle}>Message envoyé !</Text>
            <Text style={styles.emailSubtitle}>
              Notre équipe vous contactera sous 24 h à l'adresse{' '}
              <Text style={styles.emailHighlight}>{user?.email}</Text>
            </Text>
          </View>
        );
    }
  };

  return (
    <ScreenShell>
      {/* ── HEADER ── */}
      <ScreenHeader style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            onPress={() => navigation.navigate('Profile')}
            style={({ pressed }) => [styles.headerBackBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons color={colors.text.primary} name="arrow-back" size={sizes.icon.md} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Centre d'aide</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </ScreenHeader>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Comment pouvons-{'\n'}nous vous aider ?</Text>
          <Text style={styles.heroSubtitle}>
            Cherchez une réponse ou parcourez les questions fréquentes.
          </Text>

          {/* Search bar — large, no purple, plain arrow */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={22} color={colors.text.tertiary} />
            <Text style={styles.searchPlaceholder}>Rechercher dans l'aide…</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.text.primary} />
          </View>

          {/* Suggested chips */}
          <View style={styles.chipsRow}>
            {SUGGESTED.map((label) => (
              <View key={label} style={styles.chip}>
                <Text style={styles.chipText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── FAQ ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Questions fréquentes</Text>
          <View style={styles.faqCard}>
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqId === item.id;
              return (
                <View key={item.id} style={index > 0 ? styles.faqItemBorder : undefined}>
                  <Pressable
                    onPress={() => setOpenFaqId(isOpen ? '' : item.id)}
                    style={({ pressed }) => [styles.faqRow, pressed && { opacity: 0.75 }]}
                  >
                    <Text style={[styles.faqQuestion, isOpen && styles.faqQuestionOpen]}>
                      {item.question}
                    </Text>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={isOpen ? colors.primary.DEFAULT : colors.text.tertiary}
                    />
                  </Pressable>
                  {isOpen ? (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{item.answer}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── CONTACT ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Nous contacter</Text>
          <Animated.View style={{ opacity: fadeAnim }}>
            {renderContactBody()}
          </Animated.View>
        </View>

      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  /* ── HEADER ── */
  header: {
    ...patterns.headerShell,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerBackBtn: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.full,
    borderWidth: 1,
    height: sizes.touch.sm,
    justifyContent: 'center',
    width: sizes.touch.sm,
  },
  headerTitleWrap: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },
  headerSpacer: {
    width: sizes.touch.sm,
  },

  /* ── SCROLL ── */
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },

  /* ── HERO ── */
  heroSection: {
    ...patterns.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.3,
    lineHeight: 32,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },

  /* Search bar */
  searchBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 58,
    paddingHorizontal: spacing.md,
    ...shadows.medium,
  },
  searchPlaceholder: {
    ...typography.bodyMD,
    color: colors.text.tertiary,
    flex: 1,
  },

  /* Suggested chips */
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  chipText: {
    ...typography.bodySM,
    color: colors.text.secondary,
    fontWeight: '600',
  },

  /* ── SECTION ── */
  section: {
    ...patterns.screenPadding,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },

  /* ── FAQ ── */
  faqCard: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.medium,
  },
  faqItemBorder: {
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
  },
  faqRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  faqQuestion: {
    ...typography.bodyMD,
    color: colors.text.primary,
    flex: 1,
    fontWeight: '600',
    lineHeight: 20,
  },
  faqQuestionOpen: {
    color: colors.primary.DEFAULT,
  },
  faqAnswer: {
    backgroundColor: colors.primary[50],
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  faqAnswerText: {
    ...typography.bodySM,
    color: colors.text.secondary,
    lineHeight: 20,
  },

  /* ── CONTACT ── */
  contactCard: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.medium,
  },
  contactRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 60,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  contactRowPressed: {
    backgroundColor: colors.state.surfacePressed,
  },
  contactIconWrap: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: 40,
    justifyContent: 'center',
    width: 40,
    flexShrink: 0,
  },
  contactIconWa: {
    backgroundColor: '#25D366',
  },
  contactIconEmail: {
    backgroundColor: colors.primary.DEFAULT,
  },
  contactRowText: {
    flex: 1,
    minWidth: 0,
  },
  contactRowLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  contactRowLabel: {
    ...typography.bodyMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  onlineBadge: {
    alignItems: 'center',
    backgroundColor: colors.success[50],
    borderRadius: radii.full,
    flexDirection: 'row',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  onlineDot: {
    backgroundColor: colors.success.DEFAULT,
    borderRadius: radii.full,
    height: 6,
    width: 6,
  },
  onlineBadgeText: {
    ...typography.labelSM,
    color: colors.success.dark,
    fontSize: 10,
    fontWeight: '700',
  },
  contactRowSub: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: 2,
  },
  contactDivider: {
    backgroundColor: colors.borderSubtle,
    height: 1,
    marginLeft: spacing.lg + 40 + spacing.md, // indent past icon
  },

  /* Email form */
  backLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  backLinkText: {
    ...typography.bodySM,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  emailIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: radii.full,
    height: 72,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 72,
    alignSelf: 'center',
  },
  emailTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  emailSubtitle: {
    ...typography.bodySM,
    color: colors.text.secondary,
    lineHeight: 20,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
  },
  emailHighlight: {
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: colors.error[50],
    borderColor: colors.error[100],
    borderRadius: radii.md,
    borderWidth: 1,
    margin: spacing.lg,
    marginBottom: 0,
    padding: spacing.md,
  },
  errorText: {
    ...typography.bodySM,
    color: colors.error.DEFAULT,
  },
  inputWrap: {
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  inputLabel: {
    ...typography.labelSM,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    color: colors.text.primary,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    width: '100%',
  },
  inputMultiline: {
    height: 100,
    paddingTop: spacing.md,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    margin: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  sendButtonPressed: {
    backgroundColor: colors.primary.dark,
    transform: [{ scale: 0.98 }],
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    ...typography.labelMD,
    color: colors.white,
    fontWeight: '700',
  },

  /* Success */
  successCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  successIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.success[50],
    borderRadius: radii.full,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
});
