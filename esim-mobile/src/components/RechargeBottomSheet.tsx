import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTopupEsim, useTopupOffers } from '../hooks/client/useTopupEsim';
import { colors, radii, spacing } from '../theme';
import type { Esim } from '../types/esim';

interface RechargeBottomSheetProps {
  esim: Esim | null;
  visible: boolean;
  onClose: () => void;
}

export const RechargeBottomSheet = ({
  esim,
  visible,
  onClose,
}: RechargeBottomSheetProps) => {
  const navigation = useNavigation<any>();
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const offersQuery = useTopupOffers(esim?.id ?? '', visible && !!esim);
  const topupMutation = useTopupEsim();

  const handleConfirm = async () => {
    if (!esim || !selectedOfferId) return;

    setIsProcessing(true);
    try {
      const result = await topupMutation.mutateAsync({
        esimId: esim.id,
        offerId: selectedOfferId,
        paymentMethod: 'card',
      });

      onClose();

      if (result.status === 'PENDING_PAYMENT' && result.paymentUrl) {
        navigation.getParent()?.navigate('HomeTab', {
          screen: 'PaymentWebView',
          params: {
            paymentUrl: result.paymentUrl,
            transactionId: result.transactionId,
          },
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!esim) return null;

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

        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>Recharger votre eSIM</Text>
            <Text style={styles.sheetSubtitle}>{esim.country}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={colors.text.secondary} />
          </Pressable>
        </View>

        {offersQuery.isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary.DEFAULT} />
            <Text style={styles.loadingText}>Chargement des offres...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.offersList}
            showsVerticalScrollIndicator={false}
          >
            {(offersQuery.data ?? []).map((offer: any) => (
              <Pressable
                key={offer.id}
                onPress={() => setSelectedOfferId(offer.id)}
                style={[
                  styles.offerCard,
                  selectedOfferId === offer.id && styles.offerCardSelected,
                ]}
              >
                <View style={styles.offerLeft}>
                  <Text style={styles.offerData}>
                    {(offer.dataVolume / 1024).toFixed(0)} GB
                  </Text>
                  <Text style={styles.offerValidity}>
                    {offer.validityDays} jours
                  </Text>
                </View>
                <View style={styles.offerRight}>
                  {selectedOfferId === offer.id ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary.DEFAULT}
                    />
                  ) : null}
                  <Text style={styles.offerPrice}>
                    {offer.price.toFixed(2)} DT
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!selectedOfferId || isProcessing}
          onPress={handleConfirm}
          style={[
            styles.confirmButton,
            (!selectedOfferId || isProcessing) && styles.confirmButtonDisabled,
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#1C1917" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmer et payer</Text>
          )}
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
    maxHeight: '75%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  offersList: {
    maxHeight: 280,
    marginBottom: 20,
  },
  offerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  offerCardSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  offerLeft: {
    gap: 4,
  },
  offerData: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  offerValidity: {
    fontSize: 13,
    color: '#6B7280',
  },
  offerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  offerPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
  },
  confirmButton: {
    backgroundColor: '#FACC15',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#1C1917',
    fontSize: 16,
    fontWeight: '700',
  },
});
