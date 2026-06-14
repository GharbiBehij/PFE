import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './Client/MainTabs';
import { ResellerTabs } from './reseller/ResellerTabs';
import { WebOnlyScreen } from '../screens/auth/WebOnlyScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ResellerLoginScreen } from '../screens/auth/ResellerLoginScreen';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useAuth } from '../hooks/client/useAuth';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background },
  animation: 'slide_from_right' as const,
};

export const RootNavigator = () => {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (user?.role === 'SALESMAN') {
    return <ResellerTabs />;
  }

  if (user?.role === 'ZONE_CHIEF') {
    return <WebOnlyScreen />;
  }

  // Authenticated CLIENT — no auth screens needed.
  if (user) {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    );
  }

  // Unauthenticated — Onboarding is the entry point.
  // MainTabs is included so guests can browse without an account.
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen as any} />
      <Stack.Screen name="Login" component={LoginScreen as any} />
      <Stack.Screen name="Register" component={RegisterScreen as any} />
      <Stack.Screen name="ResellerLogin" component={ResellerLoginScreen as any} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
};
