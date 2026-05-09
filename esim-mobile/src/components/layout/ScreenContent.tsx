import type { ReactNode } from 'react';
import type { RefObject } from 'react';
import type { ScrollViewProps, StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

type ScreenContentProps = {
  children: ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: ScrollViewProps['showsVerticalScrollIndicator'];
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  scrollViewRef?: RefObject<ScrollView | null>;
};

export const ScreenContent = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps,
  scrollViewRef,
}: ScreenContentProps) => {
  if (!scrollable) {
    return <View style={[styles.content, style]}>{children}</View>;
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      style={[styles.content, style]}
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
