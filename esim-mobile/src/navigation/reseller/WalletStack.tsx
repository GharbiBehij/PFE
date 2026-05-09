import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ResellerWalletScreen } from '../../screens/reseller/wallet/ResellerWalletScreen';
import { colors } from '../../theme';
import type { ResellerWalletStackParamList } from '../types';

const Stack = createNativeStackNavigator<ResellerWalletStackParamList>();

export const WalletStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Wallet"
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        component={ResellerWalletScreen}
        name="Wallet"
        initialParams={{ hideTabBar: false }}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
