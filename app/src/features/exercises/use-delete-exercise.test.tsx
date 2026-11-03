import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { routineKeys } from '@/features/routines/query-keys';

import { useDeleteExercise } from './use-delete-exercise';

const mockFetch = jest.fn<Promise<Response>, [Request]>();

jest.mock('@/api/client', () => {
  const createClient =
    jest.requireActual<typeof import('openapi-fetch')>('openapi-fetch').default;
  return {
    api: createClient({
      baseUrl: 'http://api.test',
      fetch: (request: Request) => mockFetch(request),
    }),
  };
});

test('deleting an exercise refreshes the routines, whose counts change', async () => {
  mockFetch.mockResolvedValue(new Response(null, { status: 204 }));
  // The defaults keep a timer running for five minutes, which holds Jest open.
  const client = new QueryClient({
    defaultOptions: { mutations: { gcTime: 0 } },
  });
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  const { result } = await renderHook(() => useDeleteExercise('squat'), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });

  await result.current.mutateAsync();

  expect(invalidate).toHaveBeenCalledWith({ queryKey: routineKeys.all });
});
