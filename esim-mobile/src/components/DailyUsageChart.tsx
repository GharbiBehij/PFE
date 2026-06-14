import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing, typography } from '../theme';

type Props = {
  data: number[];
};

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D', 'L', 'M', 'M', 'J', 'V', 'S', 'D'];

export const DailyUsageChart = ({ data }: Props) => {
  const safeData = data.length > 0 ? data : [0];
  const peakDay = Math.max(...safeData, 1);
  const periodTotalMb = safeData.reduce((sum, value) => sum + value, 0);
  const periodTotalGb = periodTotalMb / 1000;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.totalValue}>
          {periodTotalGb.toFixed(1)} <Text style={styles.totalUnit}>GB cette période</Text>
        </Text>
        <View style={styles.badge}>
          <Ionicons name="trending-up-outline" size={12} color={colors.primary.dark} />
          <Text style={styles.badgeText}>+12%</Text>
        </View>
      </View>

      <View style={styles.barsWrap}>
        {safeData.map((mb, index) => {
          const heightPercent = (mb / peakDay) * 100;
          const isToday = index === safeData.length - 1;
          return (
            <View key={`${index}-${mb}`} style={styles.barItem}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${heightPercent}%`,
                    minHeight: 4,
                    backgroundColor: isToday ? colors.primary.DEFAULT : colors.primary[100],
                  },
                ]}
              />
              <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                {DAY_LABELS[index] ?? 'J'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadows.medium,
    marginHorizontal: spacing.xxxl,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.text.primary,
  },
  totalUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  badge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.primary[100],
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary.dark,
    fontWeight: '700',
  },
  barsWrap: {
    height: 90,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: spacing.xs,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  barLabelToday: {
    color: colors.primary.DEFAULT,
  },
});
