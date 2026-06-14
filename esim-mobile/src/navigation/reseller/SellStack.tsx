import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SellESIMScreen } from '../../screens/reseller/sell/SellESIMScreen';
import { B2BSellSuccessScreen } from '../../screens/reseller/sell/B2BSellSuccessScreen';
import { colors } from '../../theme';
import type { ResellerSellStackParamList } from '../types';

const Stack = createNativeStackNavigator<ResellerSellStackParamList>();

export const SellStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Sell"
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen component={SellESIMScreen} name="Sell" options={{ headerShown: false }} />
      <Stack.Screen component={B2BSellSuccessScreen} name="B2BSellSuccess" options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};
