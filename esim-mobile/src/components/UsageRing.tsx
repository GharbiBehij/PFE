import { StyleSheet, Text, View } from 'react-native';
import type { TextStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';

type RingProps = {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  centerTop?: string;
  centerBottom?: string;
  centerTopStyle?: TextStyle;
  centerBottomStyle?: TextStyle;
};

export const UsageRing = ({
  percent,
  size = 120,
  stroke = 10,
  color = colors.primary.DEFAULT,
  track = colors.border,
  centerTop,
  centerBottom,
  centerTopStyle,
  centerBottomStyle,
}: RingProps) => {
  const clamped = Math.max(0, Math.min(percent, 100));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={track}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.center}>
        {centerTop ? <Text style={[styles.defaultTop, centerTopStyle]}>{centerTop}</Text> : null}
        {centerBottom ? <Text style={[styles.defaultBottom, centerBottomStyle]}>{centerBottom}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultTop: {
    color: colors.text.primary,
    fontSize: 26,
    fontWeight: '800',
  },
  defaultBottom: {
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
