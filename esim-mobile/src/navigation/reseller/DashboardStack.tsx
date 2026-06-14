import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivateESIMScreen } from '../../screens/reseller/dashboard/ActivateESIMScreen';
import { ResellerDashboardScreen } from '../../screens/reseller/dashboard/ResellerDashboardScreen';
import { B2BSellSuccessScreen } from '../../screens/reseller/sell/B2BSellSuccessScreen';
import { colors } from '../../theme';
import type { ResellerDashboardStackParamList } from '../types';

const Stack = createNativeStackNavigator<ResellerDashboardStackParamList>();

export const DashboardStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen component={ResellerDashboardScreen} name="Dashboard" options={{ headerShown: false }} />
      <Stack.Screen component={ActivateESIMScreen} name="ActivateESIM" options={{ headerShown: false }} />
      <Stack.Screen component={B2BSellSuccessScreen as any} name="DeferredActivationSuccess" options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};
