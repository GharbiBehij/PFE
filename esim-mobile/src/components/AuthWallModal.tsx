import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { navigateTo } from '../navigation/navigationRef';

interface AuthWallModalProps {
  visible: boolean;
  onClose: () => void;
}

const YELLOW = '#FACC15';
const PURPLE = '#7C3AED';

export const AuthWallModal = ({ visible, onClose }: AuthWallModalProps) => {
  const handleLogin = () => {
    onClose();
    navigateTo('Login', { source: 'app' });
  };

  const handleRegister = () => {
    onClose();
    navigateTo('Register', { source: 'app' });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={28} color={PURPLE} />
        </View>

        <Text style={styles.title}>Connectez-vous pour continuer</Text>
        <Text style={styles.subtitle}>
          Créez un compte gratuit ou connectez-vous{'\n'}
          pour acheter votre eSIM.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleLogin}
          style={styles.loginButton}
        >
          <Text style={styles.loginButtonText}>Se connecter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRegister}
          style={styles.registerButton}
        >
          <Text style={styles.registerButtonText}>Créer un compte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onClose}
          style={styles.dismissButton}
        >
          <Text style={styles.dismissText}>Continuer à explorer</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#1F2937',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  loginButton: {
    backgroundColor: PURPLE,
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  registerButton: {
    backgroundColor: YELLOW,
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  registerButtonText: {
    color: '#1C1917',
    fontSize: 16,
    fontWeight: '700',
  },
  dismissButton: {
    paddingVertical: 8,
  },
  dismissText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
