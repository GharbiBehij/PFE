import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import { ResellerTabs } from '../reseller/ResellerTabs';
import { LoginScreen } from '../../screens/auth/LoginScreen';
import { OnboardingScreen } from '../../screens/auth/OnboardingScreen';
import { RegisterScreen } from '../../screens/auth/RegisterScreen';
import { ResellerLoginScreen } from '../../screens/auth/ResellerLoginScreen';
import { WebOnlyScreen } from '../../screens/auth/WebOnlyScreen';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useAuth } from '../../hooks/client/useAuth';

const GuestStack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (user) {
    switch (user.role) {
      case 'SALESMAN':
        return <ResellerTabs />;
      case 'ZONE_CHIEF':
        return <WebOnlyScreen />;
      default:
        return <MainTabs />;
    }
  }

  return (
    <GuestStack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{ headerShown: false }}
    >
      <GuestStack.Screen component={MainTabs} name="MainTabs" />
      <GuestStack.Screen component={OnboardingScreen} name="Onboarding" />
      <GuestStack.Screen component={LoginScreen} name="Login" />
      <GuestStack.Screen component={RegisterScreen} name="Register" />
      <GuestStack.Screen component={ResellerLoginScreen} name="ResellerLogin" />
    </GuestStack.Navigator>
  );
};
