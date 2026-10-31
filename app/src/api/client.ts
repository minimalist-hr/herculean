import createClient from 'openapi-fetch';

import type { paths } from './schema';

/** Talks to the API, typed from api/openapi.json. Regenerate the types with `npm run api:generate`. */
export const api = createClient<paths>({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
});
