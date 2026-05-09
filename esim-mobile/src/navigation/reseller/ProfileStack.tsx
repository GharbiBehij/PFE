// src/navigation/reseller/ProfileStack.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ResellerProfileScreen } from '../../screens/reseller/profile/ResellerProfileScreen';

const Stack = createNativeStackNavigator();

export const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen component={ResellerProfileScreen} name="Profile" />
  </Stack.Navigator>
);