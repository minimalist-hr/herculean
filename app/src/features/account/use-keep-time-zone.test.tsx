import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useKeepTimeZone } from './use-keep-time-zone';
import { createTestQueryClient } from '@/test-utils/query-client';

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

jest.mock('expo-localization', () => ({
  getCalendars: () => [{ timeZone: 'Europe/London' }],
}));

function answerWith(storedTimeZone: string) {
  mockFetch.mockImplementation((request) =>
    Promise.resolve(
      Response.json({
        email: 'filip@example.com',
        name: 'Filip',
        units: 'metric',
        theme: 'matchPhone',
        color: 'nitro',
        timeZone: request.method === 'PATCH' ? 'Europe/London' : storedTimeZone,
      }),
    ),
  );
}

async function render() {
  const client = createTestQueryClient();
  await renderHook(
    () => {
      useKeepTimeZone();
    },
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  );
}

function patches() {
  return mockFetch.mock.calls.filter(([sent]) => sent.method === 'PATCH');
}

beforeEach(() => {
  mockFetch.mockReset();
});

test('a stored zone that isn’t the phone’s is updated', async () => {
  answerWith('Europe/Zagreb');
  await render();

  await waitFor(() => {
    expect(patches()).toHaveLength(1);
  });
  await expect(patches()[0][0].clone().json()).resolves.toEqual({
    timeZone: 'Europe/London',
  });
});

test('the phone’s zone already stored sends nothing', async () => {
  answerWith('Europe/London');
  await render();

  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalled();
  });
  expect(patches()).toHaveLength(0);
});
