import { QueryClient } from '@tanstack/react-query';

/**
 * A client for a test: it doesn't retry, and starts no clean-up timer that holds Jest open.
 * With `gcTime: Infinity` a query is never collected, and with 0 a finished mutation goes at once.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: 0 },
    },
  });
}
