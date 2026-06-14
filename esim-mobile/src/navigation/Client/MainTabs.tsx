import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EsimsStack } from './EsimsStack';
import { HomeStack } from './HomeStack';
import { ProfileStack } from './ProfileStack';
import { useAuth } from '../../hooks/client/useAuth';
import { colors, patterns, shadows, sizes, spacing, typography } from '../../theme';
import type { MainTabsParamList } from '../types';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';



const Tab = createBottomTabNavigator<MainTabsParamList>();

const hiddenTabBarStyle = {
  display: 'none' as const,
  height: spacing[0],
  minHeight: spacing[0],
  maxHeight: spacing[0],
  borderTopWidth: spacing[0],
  elevation: shadows.none.elevation,
  opacity: 0,
};
const shouldShowTabBar = (
  route: any,
  rootRouteName: string,
) => {
  const focusedRoute = getFocusedRouteNameFromRoute(route) ?? rootRouteName; // pass route, not route.state
  return focusedRoute === rootRouteName;
};

export const MainTabs = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const floatingTabBarStyle = useMemo(
    () => {
      const bottomInset = Math.max(insets.bottom - spacing.xs, 0);

      return {
        ...patterns.bottomNav,
        bottom: spacing[0],
        height: sizes.bottomNav.height + bottomInset,
        paddingBottom: bottomInset,
        paddingTop: spacing[0],
        borderTopWidth: 1,
        borderTopColor: colors.border,
        ...shadows.tabBar,
      };
    },
    [insets.bottom],
  );

  return (
    <Tab.Navigator
      key={isLoggedIn ? 'auth-tabs' : 'guest-tabs'}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: spacing.sm,
          paddingBottom: spacing.xs,
          minHeight: sizes.bottomNav.height,
        },
        tabBarIcon: ({ focused, color }) => {
          const iconMap: Record<string, [string, string]> = {
            HomeTab:    ['home',           'home-outline'],
            EsimsTab:   ['globe',           'globe-outline'],
            ProfileTab: ['person',         'person-outline'],
          };
          const [on, off] = iconMap[route.name] ?? ['ellipse', 'ellipse-outline'];
          return (
            <Ionicons
              color={color}
              name={(focused ? on : off) as any}
              size={sizes.bottomNav.iconSize}
            />
          );
        },
      })}
    >
      {isLoggedIn ? (
        <>
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
            component={ProfileStack}
            name="ProfileTab"
            options={({ route }) => ({
              title: 'Profil',
              tabBarStyle: shouldShowTabBar(route, 'Profile')
                ? floatingTabBarStyle
                : hiddenTabBarStyle,
            })}
          />
        </>
      ) : (
        <>
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
              tabBarStyle: shouldShowTabBar(route, 'GuestEsims')
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
        </>
      )}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabLabel: {
    ...typography.tabLabelClient,
    marginBottom: spacing.xxs,
  },
});
