import {
  ChakraPetch_400Regular,
  ChakraPetch_500Medium,
  ChakraPetch_600SemiBold,
  ChakraPetch_700Bold,
  useFonts,
} from '@expo-google-fonts/chakra-petch';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

import { useIsSignedIn } from '@/features/account/session';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';

// Keep the splash screen up until the font is ready, so text never flashes in another font.
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ChakraPetch_400Regular,
    ChakraPetch_500Medium,
    ChakraPetch_600SemiBold,
    ChakraPetch_700Bold,
  });
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppStack />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppStack() {
  const { colors } = useTheme();
  const signedIn = useIsSignedIn();

  // The window behind the screens shows during transitions, so it takes the theme's background too.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.bg);
  }, [colors.bg]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        // Pages slide in from the right and back out, on both platforms.
        animation: 'slide_from_right',
      }}
    >
      <Stack.Protected guard={signedIn} redirectTo="/create-account">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="setup" />
      </Stack.Protected>
      {/* A new account goes on to setup. */}
      <Stack.Protected guard={!signedIn} redirectTo="/setup">
        <Stack.Screen name="create-account" />
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
    </Stack>
  );
}
