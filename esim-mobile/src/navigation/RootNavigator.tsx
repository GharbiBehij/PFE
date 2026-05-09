import { AuthStack } from './Client/AuthStack';
import { MainTabs } from './Client/MainTabs';
import { ResellerTabs } from './reseller/ResellerTabs';
import { WebOnlyScreen } from '../screens/auth/WebOnlyScreen';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useAuth } from '../hooks/client/useAuth';

export const RootNavigator = () => {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!user) {
    return <AuthStack />;
  }

  switch (user.role) {
    case 'SALESMAN':
      return <ResellerTabs />;
    case 'ZONE_CHIEF':
      return <WebOnlyScreen />;
    default:
      return <MainTabs />;
  }
};
