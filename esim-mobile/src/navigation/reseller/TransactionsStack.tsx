import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransactionsScreen } from '../../screens/reseller/transactions/TransactionsScreen';
import { colors } from '../../theme';
import type { ResellerTransactionsStackParamList } from '../types';

const Stack = createNativeStackNavigator<ResellerTransactionsStackParamList>();

export const TransactionsStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Transactions"
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen component={TransactionsScreen} name="Transactions" options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};
