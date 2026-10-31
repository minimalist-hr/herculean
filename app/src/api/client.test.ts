import { endSession, startSession } from '@/features/account/session';

import { api, requestTimeoutMs } from './client';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

const fetchMock = jest.fn((_request: Request) =>
  Promise.resolve(Response.json({}, { status: 200 })),
);

beforeEach(() => {
  fetchMock.mockClear();
});

afterEach(() => endSession());

async function sentAuthorization() {
  await api.PATCH('/api/v1/users/me', {
    baseUrl: 'http://api.test',
    body: {},
    fetch: fetchMock,
  });
  return fetchMock.mock.calls[0][0].headers.get('Authorization');
}

test('a signed-in user sends the access token', async () => {
  await startSession({
    accessToken: 'access',
    expiresIn: 900,
    refreshToken: 'refresh',
  });

  await expect(sentAuthorization()).resolves.toBe('Bearer access');
});

test('a signed-out user sends no token', async () => {
  await expect(sentAuthorization()).resolves.toBeNull();
});

test('a request with no answer fails after the timeout', async () => {
  jest.useFakeTimers();
  const noAnswer = jest.spyOn(globalThis, 'fetch').mockImplementation(
    (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new Error('Aborted'));
        });
      }),
  );

  const call = api.PATCH('/api/v1/users/me', {
    baseUrl: 'http://api.test',
    body: {},
  });
  const failed = expect(call).rejects.toThrow('Aborted');
  await jest.advanceTimersByTimeAsync(requestTimeoutMs);

  await failed;
  noAnswer.mockRestore();
  jest.useRealTimers();
});
