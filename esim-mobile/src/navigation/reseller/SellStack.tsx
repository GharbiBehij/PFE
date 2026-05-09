import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SellESIMScreen } from '../../screens/reseller/sell/SellESIMScreen';
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
    </Stack.Navigator>
  );
};
