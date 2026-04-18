import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EsimDetailScreen } from '../screens/esims/EsimDetailScreen';
import { MyEsimsScreen } from '../screens/esims/MyEsimsScreen';
import { colors } from '../theme';
import type { EsimsStackParamList } from './types';

const Stack = createNativeStackNavigator<EsimsStackParamList>();

export const EsimsStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="MyEsims"
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen component={MyEsimsScreen} name="MyEsims" options={{ headerShown: false }} />
      <Stack.Screen component={EsimDetailScreen} name="EsimDetail" options={{ title: 'Détails eSIM' }} />
    </Stack.Navigator>
  );
};
