import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../../screens/home/HomeScreen';
import { DestinationsScreen } from '../../screens/offers/DestinationsScreen';
import { PackageDetailScreen } from '../../screens/offers/PackageDetailScreen';
import { PackageListingScreen } from '../../screens/offers/PackageListingScreen';
import { SearchScreen } from '../../screens/offers/SearchScreen';
import { PaymentScreen } from '../../screens/payment/PaymentScreen';
import { PaymentWebViewScreen } from '../../screens/payment/PaymentWebViewScreen';
import { ProcessingModal } from '../../screens/payment/ProcessingModal';
import { EsimFailedScreen } from '../../screens/payment/EsimFailedScreen';
import { EsimExpiredScreen } from '../../screens/payment/EsimExpiredScreen';
import { EsimSuccessScreen } from '../../screens/esims/EsimSuccessScreen';
import { colors } from '../../theme';
import type { HomeStackParamList } from '../types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen component={HomeScreen} name="Home" options={{ headerShown: false }} />
      <Stack.Screen component={SearchScreen} name="Search" options={{ title: 'Recherche' }} />
      <Stack.Screen component={DestinationsScreen} name="Destinations" options={{ title: 'Destinations' }} />
      <Stack.Screen component={PackageListingScreen} name="PackageListing" options={{ headerShown: false }} />
      <Stack.Screen component={PackageDetailScreen} name="PackageDetail" options={{ headerShown: false }} />
      <Stack.Screen component={PaymentScreen} name="Payment" options={{ headerShown: false }} />
      <Stack.Screen component={PaymentWebViewScreen} name="PaymentWebView" options={{ headerShown: false }} />
      <Stack.Screen component={ProcessingModal} name="ProcessingModal" options={{ headerShown: false }} />
      <Stack.Screen component={EsimSuccessScreen} name="EsimSuccess" options={{ headerShown: false }} />
      <Stack.Screen component={EsimFailedScreen} name="EsimFailed" options={{ headerShown: false }} />
      <Stack.Screen component={EsimExpiredScreen} name="EsimExpired" options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};
