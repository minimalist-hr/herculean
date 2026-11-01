import {
  ChakraPetch_400Regular,
  ChakraPetch_500Medium,
  ChakraPetch_600SemiBold,
  ChakraPetch_700Bold,
  useFonts,
} from '@expo-google-fonts/chakra-petch';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

import {
  useSessionStatus,
  type SessionStatus,
} from '@/features/account/session';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';

// Keep the splash screen up until the font is ready, so text never flashes in another font.
void SplashScreen.preventAutoHideAsync();

// A request with no answer already waits 15 seconds, so a failed read shows its error instead of trying again.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// Where each status opens. A screen the status doesn't allow sends the user here.
const homeOf: Record<SessionStatus, Href> = {
  restoring: '/launch',
  signedOut: '/sign-in',
  needsSetup: '/setup',
  ready: '/',
};

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
  const status = useSessionStatus();
  const home = homeOf[status];

  // The window behind the screens shows during transitions, so it takes the theme's background too.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.bg);
  }, [colors.bg]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        // Pages cross-fade. A slide on Android shows the leaving page empty while it slides out.
        animation: 'fade',
      }}
    >
      <Stack.Protected guard={status === 'restoring'} redirectTo={home}>
        <Stack.Screen name="launch" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'} redirectTo={home}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="create-account" />
      </Stack.Protected>
      {/* A reset link can open the app from closed, so these don't wait for the session to be restored. */}
      <Stack.Protected
        guard={status === 'signedOut' || status === 'restoring'}
        redirectTo={home}
      >
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-link-sent" />
        <Stack.Screen name="new-password" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'needsSetup'} redirectTo={home}>
        <Stack.Screen name="setup" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'ready'} redirectTo={home}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="exercise/[id]" />
        <Stack.Screen name="create-exercise" />
        <Stack.Screen name="groups" />
      </Stack.Protected>
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
    </Stack>
  );
}
