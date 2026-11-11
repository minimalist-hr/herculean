import { renderHook } from '@testing-library/react-native';

import { queryClient } from '@/api/query-client';

import { restoreSession } from './session-flows';
import {
  endSession,
  readRefreshToken,
  saveTokens,
  useSessionStatus,
} from './session';
import { currentUserKey } from './use-current-user';

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

const newTokens = {
  accessToken: 'access 2',
  expiresIn: 900,
  refreshToken: 'refresh 2',
};
const refused = {
  type: 'about:blank',
  title: 'Unauthorized',
  status: 401,
  detail: 'Unauthorized',
  code: 'user.invalid_refresh_token',
  traceId: '00-1',
};

function answer(answers: Record<string, () => Response>) {
  jest.spyOn(globalThis, 'fetch').mockImplementation((input) => {
    const path = new URL((input as Request).url).pathname;
    return Promise.resolve(answers[path]());
  });
}

async function status() {
  const { result } = await renderHook(() => useSessionStatus());
  return result.current;
}

afterEach(async () => {
  jest.restoreAllMocks();
  await endSession();
});

test('the user it reads is kept, so the first screen knows the units', async () => {
  const user = {
    email: 'filip@example.com',
    name: 'Filip',
    units: 'imperial',
    timeZone: 'Europe/Zagreb',
  };
  await saveTokens({
    accessToken: 'access',
    expiresIn: 900,
    refreshToken: 'refresh',
  });
  answer({
    '/api/v1/sessions/refresh': () => Response.json(newTokens),
    '/api/v1/users/me': () => Response.json(user),
  });

  await restoreSession();

  expect(queryClient.getQueryData(currentUserKey)).toEqual(user);
});

test('a stored refresh token opens the app for a user who finished setup', async () => {
  await saveTokens({
    accessToken: 'access',
    expiresIn: 900,
    refreshToken: 'refresh',
  });
  answer({
    '/api/v1/sessions/refresh': () => Response.json(newTokens),
    '/api/v1/users/me': () =>
      Response.json({
        email: 'filip@example.com',
        name: 'Filip',
        units: 'metric',
        timeZone: 'Europe/Zagreb',
      }),
  });

  await restoreSession();

  await expect(status()).resolves.toBe('ready');
  await expect(readRefreshToken()).resolves.toBe('refresh 2');
});

test('a user without a name goes back to setup', async () => {
  await saveTokens({
    accessToken: 'access',
    expiresIn: 900,
    refreshToken: 'refresh',
  });
  answer({
    '/api/v1/sessions/refresh': () => Response.json(newTokens),
    '/api/v1/users/me': () =>
      Response.json({
        email: 'filip@example.com',
        name: null,
        units: 'metric',
        timeZone: 'Europe/Zagreb',
      }),
  });

  await restoreSession();

  await expect(status()).resolves.toBe('needsSetup');
});

test('an admin goes to the inbox, even without a name', async () => {
  await saveTokens({
    accessToken: 'access',
    expiresIn: 900,
    refreshToken: 'refresh',
  });
  answer({
    '/api/v1/sessions/refresh': () => Response.json(newTokens),
    '/api/v1/users/me': () =>
      Response.json({
        email: 'admin@minimalist.hr',
        name: null,
        units: 'metric',
        timeZone: 'Etc/UTC',
        role: 'admin',
      }),
  });

  await restoreSession();

  await expect(status()).resolves.toBe('admin');
});

test('no stored refresh token shows sign in', async () => {
  answer({});

  await restoreSession();

  await expect(status()).resolves.toBe('signedOut');
});

test('a refused refresh token shows sign in', async () => {
  await saveTokens({
    accessToken: 'access',
    expiresIn: 900,
    refreshToken: 'refresh',
  });
  answer({
    '/api/v1/sessions/refresh': () => Response.json(refused, { status: 401 }),
  });

  await restoreSession();

  await expect(status()).resolves.toBe('signedOut');
  await expect(readRefreshToken()).resolves.toBeNull();
});

test('no answer keeps the refresh token for another try', async () => {
  await saveTokens({
    accessToken: 'access',
    expiresIn: 900,
    refreshToken: 'refresh',
  });
  jest
    .spyOn(globalThis, 'fetch')
    .mockRejectedValue(new TypeError('Network request failed'));

  await expect(restoreSession()).rejects.toThrow();

  await expect(readRefreshToken()).resolves.toBe('refresh');
});
