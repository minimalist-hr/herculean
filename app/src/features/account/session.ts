import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import type { components } from '@/api/schema';

type TokenResponse = components['schemas']['TokenResponse'];

/**
 * Where the user is, which decides the screens the app shows:
 * restoring at launch, signed out, signed in but setup not finished, or ready.
 */
export type SessionStatus = 'restoring' | 'signedOut' | 'needsSetup' | 'ready';

const refreshTokenKey = 'refreshToken';

let status: SessionStatus = 'restoring';

// The access token is never stored. It lives as long as the app is open.
let accessToken: string | null = null;

// The web has no secure storage, so there the refresh token lives as long as the page.
let webRefreshToken: string | null = null;

const listeners = new Set<() => void>();

/** Keeps new tokens, from creating an account, signing in or a refresh. The status stays as it is. */
export async function saveTokens(tokens: TokenResponse) {
  accessToken = tokens.accessToken;
  if (Platform.OS === 'web') {
    webRefreshToken = tokens.refreshToken;
  } else {
    await SecureStore.setItemAsync(refreshTokenKey, tokens.refreshToken);
  }
}

/** Shows the app to a signed-in user: setup until it is done, then the tabs. */
export function enterApp(setupDone: boolean) {
  setStatus(setupDone ? 'ready' : 'needsSetup');
}

/** Signs the user out on this device, or confirms there is no session at launch. */
export async function endSession() {
  accessToken = null;
  webRefreshToken = null;
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(refreshTokenKey);
  }
  setStatus('signedOut');
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

/** The session status. Screens re-render when it changes. */
export function useSessionStatus() {
  return useSyncExternalStore(subscribe, () => status);
}

function setStatus(nextStatus: SessionStatus) {
  status = nextStatus;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
