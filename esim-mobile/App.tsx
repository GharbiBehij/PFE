import './global.css';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NativeBaseProvider } from 'native-base';
import { NavigationContainer } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { nativeBaseTheme } from './src/config/nativebase-theme';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 60_000,
          },
        },
      }),
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NativeBaseProvider theme={nativeBaseTheme}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <NavigationContainer>
                <StatusBar style="dark" />
                <RootNavigator />
              </NavigationContainer>
            </AuthProvider>
          </QueryClientProvider>
        </NativeBaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
