import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EsimConsumptionScreen } from '../../screens/esims/EsimConsumptionScreen';
import { EsimDetailScreen } from '../../screens/esims/EsimDetailScreen';
import { GuestEsimsScreen } from '../../screens/esims/GuestEsimsScreen';
import { MyEsimsScreen } from '../../screens/esims/MyEsimsScreen';
import { TopupPackageScreen } from '../../screens/esims/TopupPackageScreen';
import { TopupSuccessScreen } from '../../screens/esims/TopupSuccessScreen';
import { useAuth } from '../../hooks/client/useAuth';
import { colors } from '../../theme';
import type { EsimsStackParamList } from '../types';

const Stack = createNativeStackNavigator<EsimsStackParamList>();

export const EsimsStack = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator
      key={isAuthenticated ? 'auth' : 'guest'}
      initialRouteName={isAuthenticated ? 'MyEsims' : 'GuestEsims'}
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen component={MyEsimsScreen} name="MyEsims" options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen component={GuestEsimsScreen} name="GuestEsims" options={{ headerShown: false }} />
          <Stack.Screen component={MyEsimsScreen} name="MyEsims" options={{ headerShown: false }} />
        </>
      )}
      <Stack.Screen component={EsimConsumptionScreen} name="EsimConsumption" options={{ headerShown: false }} />
      <Stack.Screen component={EsimDetailScreen} name="EsimDetail" options={{ headerShown: false }} />
      <Stack.Screen component={TopupPackageScreen} name="TopupPackage" options={{ headerShown: false }} />
      <Stack.Screen component={TopupSuccessScreen} name="TopupSuccess" options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};
