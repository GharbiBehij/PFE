import { createNavigationContainerRef } from '@react-navigation/native';

export type RootNavigationParamList = {
  MainTabs: undefined;
  Onboarding: { skipAnimation?: boolean } | undefined;
  Login: { source?: 'onboarding' | 'app'; returnTo?: string; packageId?: string } | undefined;
  Register: { source?: 'onboarding' | 'app'; returnTo?: string; packageId?: string } | undefined;
  ResellerLogin: undefined;
};

export const navigationRef = createNavigationContainerRef<RootNavigationParamList>();

export function navigateTo<RouteName extends keyof RootNavigationParamList>(
  name: RouteName,
  params?: RootNavigationParamList[RouteName],
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params as any);
  }
}
