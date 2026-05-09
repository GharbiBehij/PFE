import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EsimDetailScreen } from '../../screens/esims/EsimDetailScreen';
import { GuestEsimsScreen } from '../../screens/esims/GuestEsimsScreen';
import { MyEsimsScreen } from '../../screens/esims/MyEsimsScreen';
import { useAuth } from '../../hooks/client/useAuth';
import { colors } from '../../theme';
import type { EsimsStackParamList } from '../types';

const Stack = createNativeStackNavigator<EsimsStackParamList>();

export const EsimsStack = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? 'MyEsims' : 'GuestEsims'}
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen
            component={MyEsimsScreen}
            name="MyEsims"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            component={EsimDetailScreen}
            name="EsimDetail"
            options={{ title: 'Détails eSIM' }}
          />
        </>
      ) : (
        <Stack.Screen
          component={GuestEsimsScreen}
          name="GuestEsims"
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};
