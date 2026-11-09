import { QueryClient } from '@tanstack/react-query';

import { ApiProblemError } from './problem';

/** A read that fails quickly gets one more try, for a blip in the connection. One that already waited out its time, or that the API refused, doesn't. */
export function retryOnce(failureCount: number, error: Error) {
  if (failureCount > 0 || error.name === 'AbortError') {
    return false;
  }

  return !(error instanceof ApiProblemError && error.problem.status < 500);
}

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: retryOnce } },
});
