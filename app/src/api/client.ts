import createClient from 'openapi-fetch';

import { getAccessToken } from '@/features/account/session';

import type { paths } from './schema';

// A request that gets no answer fails after this, so no screen waits forever.
export const requestTimeoutMs = 15_000;

/** Talks to the API, typed from api/openapi.json. Regenerate the types with `npm run api:generate`. */
export const api = createClient<paths>({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
  fetch: fetchWithTimeout,
});

// Every request carries the signed-in user's access token.
api.use({
  onRequest({ request }) {
    const accessToken = getAccessToken();
    if (accessToken !== null) {
      request.headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return request;
  },
});

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
