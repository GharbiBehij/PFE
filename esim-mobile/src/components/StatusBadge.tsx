import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

type StatusBadgeProps = {
  status: string;
};

const statusColors: Record<string, { background: string; border: string; text: string }> = {
  ACTIVE: colors.status.active,
  NOT_ACTIVE: colors.status.inactive,
  EXPIRED: colors.status.expired,
  DELETED: colors.status.deleted,
  PENDING: colors.status.pending,
  PROCESSING: colors.status.processing,
  SUCCEEDED: colors.status.succeeded,
  FAILED: colors.status.failed,
};

const toFrenchStatus = (status: string) => {
  const labels: Record<string, string> = {
    ACTIVE: 'Actif',
    NOT_ACTIVE: 'En attente',
    EXPIRED: 'Expiré',
    DELETED: 'Supprimé',
    PENDING: 'En attente',
    PROCESSING: 'En cours',
    SUCCEEDED: 'Réussi',
    FAILED: 'Échoué',
  };

  return labels[status.toUpperCase()] ?? status;
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const style = statusColors[status.toUpperCase()] ?? {
    background: colors.primary[100],
    border: colors.primary[200],
    text: colors.primary.dark,
  };

  return (
    <View style={[styles.badge, { backgroundColor: style.background, borderColor: style.border }]}>
      <Text style={[styles.text, { color: style.text }]}>{toFrenchStatus(status)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm + spacing.xxs,
    paddingVertical: spacing.xs,
  },
  text: {
    fontSize: typography.overline.fontSize,
    fontWeight: '700',
    lineHeight: typography.overline.lineHeight,
  },
});
