import { act, renderHook } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import {
  endSession,
  enterApp,
  getAccessToken,
  readRefreshToken,
  saveTokens,
  useSessionStatus,
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

test('the app starts by restoring the session', async () => {
  // The first test in this file, so the module is as it is at launch.
  const { result } = await renderHook(() => useSessionStatus());

  expect(result.current).toBe('restoring');
});

test('saved tokens keep the access token in memory', async () => {
  await saveTokens(tokens);

  expect(getAccessToken()).toBe('access');
});

test('on the phone the refresh token goes to secure storage', async () => {
  await saveTokens(tokens);

  expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
    'refreshToken',
    'refresh',
  );
  await expect(readRefreshToken()).resolves.toBe('refresh');
});

test('on the web the refresh token stays in memory', async () => {
  Platform.OS = 'web';
  jest.mocked(SecureStore.setItemAsync).mockClear();

  await saveTokens(tokens);

  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  await expect(readRefreshToken()).resolves.toBe('refresh');
});

test('ending the session forgets both tokens and signs out', async () => {
  await saveTokens(tokens);
  enterApp(true);

  await endSession();

  expect(getAccessToken()).toBeNull();
  await expect(readRefreshToken()).resolves.toBeNull();
  const { result } = await renderHook(() => useSessionStatus());
  expect(result.current).toBe('signedOut');
});

test('screens follow the status: setup first, then the app', async () => {
  const { result } = await renderHook(() => useSessionStatus());

  await act(() => {
    enterApp(false);
  });
  expect(result.current).toBe('needsSetup');

  await act(() => {
    enterApp(true);
  });
  expect(result.current).toBe('ready');

  await act(() => endSession());
  expect(result.current).toBe('signedOut');
});
