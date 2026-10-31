import { act, renderHook } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import {
  endSession,
  getAccessToken,
  readRefreshToken,
  startSession,
  useIsSignedIn,
} from './session';

jest.mock('expo-secure-store', () => {
  const stored = new Map<string, string>();
  return {
    setItemAsync: jest.fn((key: string, value: string) =>
      Promise.resolve(void stored.set(key, value)),
    ),
    getItemAsync: jest.fn((key: string) =>
      Promise.resolve(stored.get(key) ?? null),
    ),
    deleteItemAsync: jest.fn((key: string) =>
      Promise.resolve(void stored.delete(key)),
    ),
  };
});

const tokens = {
  accessToken: 'access',
  expiresIn: 900,
  refreshToken: 'refresh',
};

afterEach(async () => {
  await endSession();
  Platform.OS = 'ios';
});

test('starting a session keeps the access token in memory', async () => {
  await startSession(tokens);

  expect(getAccessToken()).toBe('access');
});

test('on the phone the refresh token goes to secure storage', async () => {
  await startSession(tokens);

  expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
    'refreshToken',
    'refresh',
  );
  await expect(readRefreshToken()).resolves.toBe('refresh');
});

test('on the web the refresh token stays in memory', async () => {
  Platform.OS = 'web';
  jest.mocked(SecureStore.setItemAsync).mockClear();

  await startSession(tokens);

  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  await expect(readRefreshToken()).resolves.toBe('refresh');
});

test('ending the session forgets both tokens', async () => {
  await startSession(tokens);

  await endSession();

  expect(getAccessToken()).toBeNull();
  await expect(readRefreshToken()).resolves.toBeNull();
});

test('screens follow whether a user is signed in', async () => {
  const { result } = await renderHook(() => useIsSignedIn());
  expect(result.current).toBe(false);

  await act(() => startSession(tokens));
  expect(result.current).toBe(true);

  await act(() => endSession());
  expect(result.current).toBe(false);
});
