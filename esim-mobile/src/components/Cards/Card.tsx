// components/ui/Card.tsx
import { View, type ViewProps } from 'react-native';
import { patterns } from '../../theme';

type CardProps = ViewProps & {
  compact?: boolean;
};

export const Card = ({ compact, style, ...rest }: CardProps) => {
  return (
    <View
      style={[compact ? patterns.cardCompact : patterns.card, style]}
      {...rest}
    />
  );
};