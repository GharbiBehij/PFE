import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EsimsStack } from './EsimsStack';
import { HomeStack } from './HomeStack';
import { ProfileStack } from './ProfileStack';
import { colors, patterns, shadows, sizes, spacing } from '../theme';
import type { MainTabsParamList } from './types';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const hiddenTabBarStyle = {
  display: 'none' as const,
};

const HIDDEN_ROUTES = new Set([
  'PackageListing',
  'PackageDetail',
  'Payment',
  'Success',
  'Search',
  'Destinations',
  'EsimDetail',
  'PersonalDetails',
  'PaymentMethods',
  'Settings',
  'HelpCenter',
  'Wallet',
  'TopUp',
]);

const shouldShowTabBar = (
  route: Parameters<typeof getFocusedRouteNameFromRoute>[0],
  rootRouteName: string,
) => {
  const paramsRoute = (route as { params?: { screen?: string } } | undefined)?.params?.screen;
  const activeRoute = getFocusedRouteNameFromRoute(route) ?? paramsRoute ?? rootRouteName;

  if (HIDDEN_ROUTES.has(activeRoute)) {
    return false;
  }

  return activeRoute === rootRouteName;
};

export const MainTabs = () => {
  const insets = useSafeAreaInsets();

  const floatingTabBarStyle = useMemo(
    () => {
      const bottomInset = Math.max(insets.bottom - spacing.xs, 0);

      return {
        ...patterns.bottomNav,
        bottom: 0,
        height: sizes.bottomNav.height + bottomInset,
        paddingBottom: bottomInset,
        paddingTop: spacing[0],
      };
    },
    [insets.bottom],
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: spacing.sm,
          paddingBottom: spacing.xs,
          minHeight: sizes.bottomNav.height,
        },
        tabBarIcon: ({ focused }) => {
          const iconName =
            route.name === 'HomeTab'
              ? focused
                ? 'home'
                : 'home-outline'
              : route.name === 'EsimsTab'
                ? focused
                  ? 'globe'
                  : 'globe-outline'
                : focused
                  ? 'person'
                  : 'person-outline';

          const iconColor = colors.primary.DEFAULT;

          return (
            <Ionicons
              color={iconColor}
              name={iconName}
              size={sizes.bottomNav.iconSize}
              style={focused ? styles.navIcon : styles.navIconInactive}
            />
          );
        },
      })}
    >
      <Tab.Screen
        component={HomeStack}
        name="HomeTab"
        options={({ route }) => ({
          title: 'Accueil',
          tabBarStyle: shouldShowTabBar(route, 'Home')
            ? floatingTabBarStyle
            : hiddenTabBarStyle,
        })}
      />
      <Tab.Screen
        component={EsimsStack}
        name="EsimsTab"
        options={({ route }) => ({
          title: 'Mes eSIMs',
          tabBarStyle: shouldShowTabBar(route, 'MyEsims')
            ? floatingTabBarStyle
            : hiddenTabBarStyle,
        })}
      />
      <Tab.Screen
        component={ProfileStack}
        name="ProfileTab"
        options={({ route }) => ({
          title: 'Profil',
          tabBarStyle: shouldShowTabBar(route, 'Profile')
            ? floatingTabBarStyle
            : hiddenTabBarStyle,
        })}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  navIcon: {
    ...shadows.medium,
    marginTop: spacing.xs,
    opacity: 1,
  },
  navIconInactive: {
    ...shadows.medium,
    marginTop: spacing.xs,
    opacity: 0.72,
  },
});
