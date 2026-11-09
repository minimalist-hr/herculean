import {
  endSession,
  enterApp,
  getAccessToken,
  readRefreshToken,
  saveTokens,
} from '@/features/account/session';

import { api, refreshTokens, requestTimeoutMs } from './client';

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

const user = {
  email: 'filip@example.com',
  name: 'Filip',
  units: 'metric',
  timeZone: 'Europe/Zagreb',
};
const newTokens = {
  accessToken: 'access 2',
  expiresIn: 900,
  refreshToken: 'refresh 2',
};
const expired = {
  type: 'about:blank',
  title: 'Unauthorized',
  status: 401,
  detail: 'Unauthorized',
  code: 'unauthorized',
  traceId: '00-1',
};

const sent: Request[] = [];
let answer: (request: Request, signal?: AbortSignal) => Promise<Response>;

beforeEach(async () => {
  sent.length = 0;
  jest.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const request = input as Request;
    sent.push(request);
    return answer(request, init?.signal ?? undefined);
  });
  await saveTokens({
    accessToken: 'access',
    expiresIn: 900,
    refreshToken: 'refresh',
  });
  enterApp(true);
});

afterEach(async () => {
  jest.restoreAllMocks();
  await endSession();
});

function path(request: Request) {
  return new URL(request.url).pathname;
}

// Refresh works, and only the new access token is accepted.
function acceptOnlyTheNewToken(request: Request) {
  return Promise.resolve(
    path(request) === '/api/v1/sessions/refresh'
      ? Response.json(newTokens)
      : request.headers.get('Authorization') === 'Bearer access 2'
        ? Response.json(user)
        : Response.json(expired, { status: 401 }),
  );
}

// Expo's fetch answers with its own response class, not the global Response.
function asExpoResponse(response: Response) {
  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    text: () => response.text(),
    json: () => response.json(),
  } as unknown as Response;
}

test('a signed-in request carries the access token', async () => {
  answer = () => Promise.resolve(Response.json(user));

  await api.GET('/api/v1/users/me');

  expect(sent[0].headers.get('Authorization')).toBe('Bearer access');
});

test('a signed-out request carries no token', async () => {
  answer = () => Promise.resolve(Response.json(user));
  await endSession();

  await api.GET('/api/v1/users/me');

  expect(sent[0].headers.get('Authorization')).toBeNull();
});

test('an expired access token is refreshed once and the request sent again', async () => {
  answer = acceptOnlyTheNewToken;

  const { data } = await api.GET('/api/v1/users/me');

  expect(data).toEqual(user);
  expect(sent.map(path)).toEqual([
    '/api/v1/users/me',
    '/api/v1/sessions/refresh',
    '/api/v1/users/me',
  ]);
  await expect(readRefreshToken()).resolves.toBe('refresh 2');
});

test('the refresh and retry work with Expo’s responses too', async () => {
  answer = async (request) =>
    asExpoResponse(await acceptOnlyTheNewToken(request));

  const { data } = await api.GET('/api/v1/users/me');

  expect(data).toEqual(user);
});

test('a refused refresh signs the user out', async () => {
  answer = () => Promise.resolve(Response.json(expired, { status: 401 }));

  const { response } = await api.GET('/api/v1/users/me');

  expect(response.status).toBe(401);
  expect(getAccessToken()).toBeNull();
});

test('requests at the same time share one refresh', async () => {
  answer = acceptOnlyTheNewToken;

  await Promise.all([api.GET('/api/v1/users/me'), api.GET('/api/v1/users/me')]);

  expect(
    sent.filter((request) => path(request) === '/api/v1/sessions/refresh'),
  ).toHaveLength(1);
});

test('a wrong password is an answer, not an expired token', async () => {
  answer = () => Promise.resolve(Response.json(expired, { status: 401 }));

  await api.POST('/api/v1/sessions', {
    body: { email: 'filip@example.com', password: 'wrong' },
  });

  expect(sent).toHaveLength(1);
  expect(sent[0].headers.get('Authorization')).toBeNull();
});

test('a refresh without an answer throws, and keeps the session', async () => {
  answer = () => Promise.resolve(new Response('Bad Gateway', { status: 502 }));

  await expect(refreshTokens()).rejects.toThrow();
  expect(getAccessToken()).toBe('access');
});

test('a request with no answer fails after the timeout', async () => {
  jest.useFakeTimers();
  answer = (_request, signal) =>
    new Promise<Response>((_resolve, reject) => {
      signal?.addEventListener('abort', () => {
        reject(new Error('Aborted'));
      });
    });

  const call = api.GET('/api/v1/users/me');
  const failed = expect(call).rejects.toThrow('Aborted');
  await jest.advanceTimersByTimeAsync(requestTimeoutMs);

  await failed;
  jest.useRealTimers();
});
