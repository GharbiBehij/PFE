import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useAuth } from '../hooks/useAuth';

export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingOverlay message="Initialisation de la session..." />;
  }

  return isAuthenticated ? <MainTabs /> : <AuthStack />;
};
