import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadows, sizes, spacing, typography } from '../../theme';

type AuthShellProps = {
  badgeIcon: keyof typeof Ionicons.glyphMap;
  badgeLabel: string;
  children: ReactNode;
  formSubtitle: string;
  formTitle: string;
  onBack: () => void;
  subtitle: string;
  title: string;
};

export const AuthShell = ({
  badgeIcon,
  badgeLabel,
  children,
  formSubtitle,
  formTitle,
  onBack,
  subtitle,
  title,
}: AuthShellProps) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[
        colors.gradient.authStart,
        colors.gradient.authMiddle,
        colors.gradient.authEnd,
      ]}
      locations={[spacing[0], 0.5, 1]}
      start={{ x: spacing[0], y: spacing[0] }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
          <View pointerEvents="none" style={[styles.blob, styles.blobTopRight]} />
          <View pointerEvents="none" style={[styles.blob, styles.blobBottomLeft]} />

          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            onPress={onBack}
            style={styles.backButton}
          >
            <Ionicons
              color={colors.state.onPrimaryOverlay80}
              name="arrow-back"
              size={sizes.icon.md}
            />
            <Text style={styles.backText}>Retour</Text>
          </Pressable>

          <View style={styles.badge}>
            <Ionicons
              color={colors.secondary.DEFAULT}
              name={badgeIcon}
              size={sizes.icon.sm}
            />
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>

          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>
        </View>

        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.sheetScroll}
          >
            <Text style={styles.formTitle}>{formTitle}</Text>
            <Text style={styles.formSubtitle}>{formSubtitle}</Text>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  hero: {
    overflow: 'hidden',
    paddingBottom: spacing.xxxxl,
    paddingHorizontal: spacing.xl,
  },
  blob: {
    borderRadius: radii.full,
    position: 'absolute',
  },
  blobTopRight: {
    backgroundColor: colors.state.onPrimaryOverlay08,
    height: sizes.decoration.authBlobSm,
    right: -spacing.xxxxxl,
    top: -spacing.xxxxxl - spacing.lg,
    width: sizes.decoration.authBlobSm,
  },
  blobBottomLeft: {
    backgroundColor: colors.state.onPrimaryOverlay12,
    bottom: -spacing.xxxxxl,
    height: sizes.decoration.authBlobLg,
    left: -spacing.xxxxxl,
    width: sizes.decoration.authBlobLg,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xl,
    minHeight: sizes.touch.sm,
  },
  backText: {
    ...typography.bodyMD,
    color: colors.state.onPrimaryOverlay80,
    fontWeight: '600',
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.state.onPrimaryOverlay15,
    borderColor: colors.state.onPrimaryOverlay20,
    borderRadius: radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    ...typography.labelSM,
    color: colors.white,
    letterSpacing: typography.caption.letterSpacing,
  },
  heroTitle: {
    ...typography.titleXL,
    color: colors.white,
    fontWeight: '700',
  },
  heroSubtitle: {
    ...typography.bodyMD,
    color: colors.primary[200],
    marginTop: spacing.sm,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.authSheet,
    borderTopRightRadius: radii.authSheet,
    flex: 1,
    ...shadows.sheetTop,
  },
  sheetScroll: {
    borderTopLeftRadius: radii.authSheet,
    borderTopRightRadius: radii.authSheet,
    flex: 1,
  },
  sheetContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  formTitle: {
    ...typography.titleLG,
    color: colors.gray[800],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    ...typography.bodyMD,
    color: colors.gray[400],
    marginBottom: spacing.xl,
  },
});
