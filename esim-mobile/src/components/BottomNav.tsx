import { StyleSheet, View } from 'react-native';
import { patterns } from '../theme';

export const BottomNav = () => {
  return <View style={styles.container} />;
};

const styles = StyleSheet.create({
  container: {
    ...patterns.bottomNav,
  },
});
