import {
  ChakraPetch_400Regular,
  ChakraPetch_500Medium,
  ChakraPetch_600SemiBold,
  ChakraPetch_700Bold,
  useFonts,
} from '@expo-google-fonts/chakra-petch';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  DarkTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
  type Href,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { queryClient } from '@/api/query-client';
import { NotificationBar } from '@/components/notification-bar';
import { usePageOptions } from '@/components/use-page-options';
import {
  useSessionStatus,
  type SessionStatus,
} from '@/features/account/session';
import { clearUserData } from '@/features/account/session-flows';
import { UserThemeProvider } from '@/features/settings/user-theme-provider';
import { useTheme } from '@/theme/theme-provider';

// Keep the splash screen up until the font is ready, so text never flashes in another font.
void SplashScreen.preventAutoHideAsync();

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
      <UserThemeProvider>
        <AppStack />
      </UserThemeProvider>
    </QueryClientProvider>
  );
}

function AppStack() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const status = useSessionStatus();
  const pageOptions = usePageOptions();
  const home = homeOf[status];
  // Stacks inside a tab paint this behind their pages during transitions.
  const navigationTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: { ...DarkTheme.colors, background: colors.bg },
    }),
    [colors.bg],
  );

  // However the session ended, the next person on this phone sees nothing of the last one's.
  useEffect(() => {
    if (status === 'signedOut') {
      clearUserData();
    }
  }, [status]);

  // The window behind the screens shows during transitions, so it takes the theme's background too.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.bg);
  }, [colors.bg]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      {/* Pages start below the status bar, so nothing scrolls behind the clock. */}
      <View
        style={[
          styles.app,
          { paddingTop: insets.top, backgroundColor: colors.bg },
        ]}
      >
        <Stack screenOptions={pageOptions}>
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
            <Stack.Screen name="routine/[id]/edit" />
            <Stack.Screen name="routine/new" />
            <Stack.Screen name="exercise/new" />
            <Stack.Screen name="exercise/[id]/edit" />
            <Stack.Screen name="group/new" />
            <Stack.Screen name="group/[id]/edit" />
            <Stack.Screen name="settings" />
          </Stack.Protected>
          {/* An email change link works signed in, signed out and from a closed app. */}
          <Stack.Screen name="confirm-email" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="privacy" />
        </Stack>
      </View>
      <NotificationBar />
    </NavigationThemeProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
  },
});
