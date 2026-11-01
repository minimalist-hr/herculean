import createClient from 'openapi-fetch';

import {
  endSession,
  getAccessToken,
  readRefreshToken,
  saveTokens,
} from '@/features/account/session';

import { toApiError } from './problem';
import type { paths } from './schema';

// A request that gets no answer fails after this, so no screen waits forever.
export const requestTimeoutMs = 15_000;

// Sign in and refresh hand out tokens. A 401 from them is the answer, not an expired token.
const tokenPaths = ['/api/v1/sessions', '/api/v1/sessions/refresh'];

/** Talks to the API, typed from api/openapi.json. Regenerate the types with `npm run api:generate`. */
export const api = createClient<paths>({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
  // Not middleware: openapi-fetch only accepts its own Response class back from middleware, and Expo's fetch answers with another one.
  fetch: fetchSignedIn,
});

/**
 * Sends a request with the signed-in user's access token.
 * An expired access token gets one refresh and one more try. If the refresh fails, the user signs in again.
 */
async function fetchSignedIn(request: Request) {
  const accessToken = getAccessToken();
  if (accessToken === null || isTokenRequest(request)) {
    return fetchWithTimeout(request);
  }

  const retryCopy = request.clone();
  request.headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetchWithTimeout(request);
  if (response.status !== 401) {
    return response;
  }

  if (!(await refreshTokens())) {
    await endSession();
    return response;
  }

  retryCopy.headers.set('Authorization', `Bearer ${getAccessToken() ?? ''}`);
  return fetchWithTimeout(retryCopy);
}

let refreshing: Promise<boolean> | null = null;

/**
 * Swaps the stored refresh token for new tokens. Requests that need it at the same time share one refresh.
 * @returns False when there is no refresh token or the API refuses it: the user has to sign in again.
 * @throws When the API gives no answer, for example without a connection.
 */
export function refreshTokens(): Promise<boolean> {
  refreshing ??= refreshOnce().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function refreshOnce() {
  const refreshToken = await readRefreshToken();
  if (refreshToken === null) {
    return false;
  }

  const { data, error, response } = await api.POST('/api/v1/sessions/refresh', {
    body: { refreshToken },
  });
  if (data !== undefined) {
    await saveTokens(data);
    return true;
  }
  if (response.status === 401) {
    return false;
  }
  throw toApiError(error);
}

function isTokenRequest(request: Request) {
  return tokenPaths.includes(new URL(request.url).pathname);
}

async function fetchWithTimeout(request: Request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, requestTimeoutMs);

  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
