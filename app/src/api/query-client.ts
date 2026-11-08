import { QueryClient } from '@tanstack/react-query';

// A request with no answer already waits 15 seconds, so a failed read shows its error instead of trying again.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
