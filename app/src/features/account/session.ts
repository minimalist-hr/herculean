import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import type { components } from '@/api/schema';

type TokenResponse = components['schemas']['TokenResponse'];

const refreshTokenKey = 'refreshToken';

// The access token is never stored. It lives as long as the app is open.
let accessToken: string | null = null;

// The web has no secure storage, so there the refresh token lives as long as the page.
let webRefreshToken: string | null = null;

const listeners = new Set<() => void>();

/** Signs the user in with the tokens from creating an account or signing in. */
export async function startSession(tokens: TokenResponse) {
  accessToken = tokens.accessToken;
  if (Platform.OS === 'web') {
    webRefreshToken = tokens.refreshToken;
  } else {
    await SecureStore.setItemAsync(refreshTokenKey, tokens.refreshToken);
  }
  notify();
}

/** Signs the user out on this device. */
export async function endSession() {
  accessToken = null;
  webRefreshToken = null;
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(refreshTokenKey);
  }
  notify();
}

/** The token the API client sends with every request, or null when signed out. */
export function getAccessToken() {
  return accessToken;
}

/** The stored refresh token, or null when there is none. */
export function readRefreshToken(): Promise<string | null> {
  return Platform.OS === 'web'
    ? Promise.resolve(webRefreshToken)
    : SecureStore.getItemAsync(refreshTokenKey);
}

/** True while a user is signed in. Screens re-render when it changes. */
export function useIsSignedIn() {
  return useSyncExternalStore(subscribe, () => accessToken !== null);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}
