import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DestinationsScreen } from '../../screens/offers/DestinationsScreen';
import { PackageDetailScreen } from '../../screens/offers/PackageDetailScreen';
import { PackageListingScreen } from '../../screens/offers/PackageListingScreen';
import { SearchScreen } from '../../screens/offers/SearchScreen';
import { EsimFailedScreen } from '../../screens/payment/EsimFailedScreen';
import { EsimExpiredScreen } from '../../screens/payment/EsimExpiredScreen';
import { EsimSuccessScreen } from '../../screens/esims/EsimSuccessScreen';
import { PaymentScreen } from '../../screens/payment/PaymentScreen';
import { PaymentWebViewScreen } from '../../screens/payment/PaymentWebViewScreen';
import { ProcessingModal } from '../../screens/payment/ProcessingModal';
import { SuccessScreen } from '../../screens/payment/SuccessScreen';
import { colors } from '../../theme';
import type { OffersStackParamList } from '../types';

const Stack = createNativeStackNavigator<OffersStackParamList>();

export const OffersStack = () => (
  <Stack.Navigator
    initialRouteName="Destinations"
    screenOptions={{
      contentStyle: { backgroundColor: colors.background },
      headerShadowVisible: false,
    }}
  >
    <Stack.Screen component={DestinationsScreen} name="Destinations" options={{ headerShown: false }} />
    <Stack.Screen component={SearchScreen}        name="Search"       options={{ headerShown: false }} />
    <Stack.Screen component={PackageListingScreen} name="PackageListing" options={{ headerShown: false }} />
    <Stack.Screen component={PackageDetailScreen}  name="PackageDetail"  options={{ headerShown: false }} />
    <Stack.Screen component={PaymentScreen}        name="Payment"        options={{ headerShown: false }} />
    <Stack.Screen component={PaymentWebViewScreen} name="PaymentWebView" options={{ headerShown: false }} />
    <Stack.Screen component={ProcessingModal}      name="ProcessingModal" options={{ headerShown: false }} />
    <Stack.Screen component={SuccessScreen}        name="PaymentSuccess"  options={{ headerShown: false }} />
    <Stack.Screen component={EsimSuccessScreen}    name="EsimSuccess"     options={{ headerShown: false }} />
    <Stack.Screen component={EsimFailedScreen}     name="EsimFailed"      options={{ headerShown: false }} />
    <Stack.Screen component={EsimExpiredScreen}    name="EsimExpired"     options={{ headerShown: false }} />
  </Stack.Navigator>
);
