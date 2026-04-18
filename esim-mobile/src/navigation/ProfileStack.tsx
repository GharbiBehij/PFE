import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HelpCenterScreen } from '../screens/profile/HelpCenterScreen';
import { PaymentMethodsScreen } from '../screens/profile/PaymentMethodsScreen';
import { PersonalDetailsScreen } from '../screens/profile/PersonalDetailsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { TopUpScreen } from '../screens/wallet/TopUpScreen';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { colors } from '../theme';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen component={ProfileScreen} name="Profile" options={{ headerShown: false }} />
      <Stack.Screen component={PersonalDetailsScreen} name="PersonalDetails" options={{ headerShown: false }} />
      <Stack.Screen component={PaymentMethodsScreen} name="PaymentMethods" options={{ headerShown: false }} />
      <Stack.Screen component={SettingsScreen} name="Settings" options={{ headerShown: false }} />
      <Stack.Screen component={HelpCenterScreen} name="HelpCenter" options={{ headerShown: false }} />
      <Stack.Screen component={WalletScreen} name="Wallet" options={{ headerShown: false }} />
      <Stack.Screen component={TopUpScreen} name="TopUp" options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};
