import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import '../src/i18n'; // Translation Engine
import {
  useFonts,
  Nunito_300Light, Nunito_400Regular, Nunito_500Medium,
  Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// ✅ CORE CONTEXT
import { AppProvider } from '../src/store/AppContext';
// ✅ NEW MARKET CONTEXTS
import { CartProvider } from '../src/context/CartContext';
import { UserProvider } from '../src/context/UserContext';

// Prevent the splash screen from auto-hiding before fonts are loaded

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_300Light,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        {/* UserProvider MUST be inside AppProvider because it pulls data from it */}
        <UserProvider>
          <CartProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            >
              {/* ── ROOT SCREENS ── */}
              <Stack.Screen name="index" />

              {/* (auth) covers login, register, onboard, etc. */}
              <Stack.Screen name="(auth)" />

              <Stack.Screen
                name="drawer"
                options={{
                  animation: 'fade',
                  gestureEnabled: false // Prevents swiping back to login
                }}
              />
            </Stack>
          </CartProvider>
        </UserProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}