import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, patterns, shadows, sizes, spacing, typography } from '../../theme';
import type { ResellerTabsParamList } from '../types';
import { DashboardStack } from './DashboardStack';
import { SellStack } from './SellStack';
import { TransactionsStack } from './TransactionsStack';
import { WalletStack } from './WalletStack';
import { ResellerProfileScreen } from '../../screens/reseller/profile/ResellerProfileScreen';


const Tab = createBottomTabNavigator<ResellerTabsParamList>();

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
  const focusedRoute = getFocusedRouteNameFromRoute(route) ?? rootRouteName;
  return focusedRoute === rootRouteName;
};

const shouldShowWalletTabBar = (route: any) => {
  if (route?.params?.hideTabBar === true) {
    return false;
  }

  const focusedRoute = getFocusedRouteNameFromRoute(route) ?? 'Wallet';
  if (focusedRoute !== 'Wallet') {
    return false;
  }

  const state = route?.state;
  const routes = Array.isArray(state?.routes) ? state.routes : [];
  const index = typeof state?.index === 'number' ? state.index : routes.length - 1;
  const activeRoute = routes[index] ?? routes[0];
  const hideTabBar = activeRoute?.params?.hideTabBar === true;
  return !hideTabBar;
};

export const ResellerTabs = () => {
  const insets = useSafeAreaInsets();

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
        tabBarIcon: ({ color, focused }) => {
          const iconName =
            route.name === 'DashboardTab'
              ? focused ? 'home' : 'home-outline'
              : route.name === 'SellTab'
                ? focused ? 'add-circle' : 'add-circle-outline'
                : route.name === 'TransactionsTab'
                  ? focused ? 'receipt' : 'receipt-outline'
                  : route.name === 'WalletTab'
                    ? focused ? 'wallet' : 'wallet-outline'
                    : focused ? 'person' : 'person-outline';

          return (
            <Ionicons
              color={color}
              name={iconName}
              size={sizes.bottomNav.iconSize}
            />
          );
        },
      })}
    >
      <Tab.Screen
        component={DashboardStack}
        name="DashboardTab"
        options={({ route }) => ({
          tabBarLabel: 'Accueil',
          title: 'Tableau de bord',
          tabBarStyle: shouldShowTabBar(route, 'Dashboard')
            ? floatingTabBarStyle
            : hiddenTabBarStyle,
        })}
      />
      <Tab.Screen
        component={SellStack}
        name="SellTab"
        options={({ route }) => ({
          tabBarLabel: 'Vendre',
          title: 'Vendre',
          tabBarStyle: shouldShowTabBar(route, 'Sell')
            ? floatingTabBarStyle
            : hiddenTabBarStyle,
        })}
      />
      <Tab.Screen
        component={TransactionsStack}
        name="TransactionsTab"
        options={({ route }) => ({
          tabBarLabel: 'Transactions',
          title: 'Transactions',
          tabBarStyle: shouldShowTabBar(route, 'Transactions')
            ? floatingTabBarStyle
            : hiddenTabBarStyle,
        })}
      />
      <Tab.Screen
        component={WalletStack}
        name="WalletTab"
        options={({ route }) => ({
          tabBarLabel: 'Portefeuille',
          title: 'Portefeuille',
          tabBarStyle: shouldShowWalletTabBar(route)
            ? floatingTabBarStyle
            : hiddenTabBarStyle,
        })}
      />
      <Tab.Screen
        component={ResellerProfileScreen}
        name="ProfileTab"
        options={({ route }) => ({
          tabBarLabel: 'Profil',
          tabBarStyle: shouldShowTabBar(route, 'Profile')
            ? floatingTabBarStyle
            : hiddenTabBarStyle,
        })}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabLabel: {
    ...typography.tabLabelReseller,
    marginBottom: spacing.xxs,
  },
});
