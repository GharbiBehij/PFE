import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OutlineButton, PurpleButton } from './Buttons';
import { navigateTo } from '../navigation/navigationRef';
import { colors, radii, shadows, sizes, spacing, typography } from '../theme';

interface AuthWallModalProps {
  visible: boolean;
  onClose: () => void;
  packageId?: string;
}

export const AuthWallModal = ({ visible, onClose, packageId }: AuthWallModalProps) => {
  const insets = useSafeAreaInsets();

  const handleLogin = () => {
    onClose();
    navigateTo('Login', { source: 'app', returnTo: 'Payment', packageId });
  };

  const handleRegister = () => {
    onClose();
    navigateTo('Register', { source: 'app', returnTo: 'Payment', packageId });
  };

  const bottomPad = Math.max(spacing.xxxl, insets.bottom + spacing.lg);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/*
        Les deux éléments sont en position absolute.
        Le backdrop est rendu EN PREMIER  → z-index inférieur.
        Le sheet    est rendu EN SECOND   → z-index supérieur, reçoit les touches.
        Aucun conflit de layout flex, fonctionne sur iOS et Android.
      */}

      {/* Backdrop — couvre tout l'écran, ferme le modal au tap */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet — ancré en bas, toujours visible */}
      <View style={[styles.sheet, { paddingBottom: bottomPad }]}>
        <View style={styles.handle} />

        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={sizes.icon.lg} color={colors.primary.DEFAULT} />
        </View>

        <Text style={styles.title}>Connectez-vous pour continuer</Text>
        <Text style={styles.subtitle}>
          Créez un compte gratuit ou connectez-vous{'\n'}
          pour acheter votre eSIM.
        </Text>

        <View style={styles.buttons}>
          <PurpleButton label="Se connecter" onPress={handleLogin} />
          <OutlineButton label="Créer un compte" onPress={handleRegister} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.authSheet,
    borderTopRightRadius: radii.authSheet,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    alignItems: 'center',
    ...shadows.high,
  },
  handle: {
    width: sizes.bottomSheet.handleWidth,
    height: sizes.bottomSheet.handleHeight,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: sizes.avatar.xl,
    height: sizes.avatar.xl,
    borderRadius: radii.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.titleMD,
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  buttons: {
    alignSelf: 'stretch',
    gap: spacing.md,
  },
});
