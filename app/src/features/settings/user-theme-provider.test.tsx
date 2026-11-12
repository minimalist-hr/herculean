import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { UserThemeProvider } from './user-theme-provider';
import { createTestQueryClient } from '@/test-utils/query-client';

const mockFetch = jest.fn<Promise<Response>, [Request]>();
const mockStored = new Map<string, string>();
let mockStatus = 'signedOut';

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

jest.mock('@/storage/phone-storage', () => ({
  storedKeys: { appearance: 'appearance' },
  readStored: (key: string) => Promise.resolve(mockStored.get(key) ?? null),
  writeStored: (key: string, value: string) => {
    mockStored.set(key, value);
    return Promise.resolve();
  },
}));

jest.mock('@/features/account/session', () => ({
  useSessionStatus: () => mockStatus,
}));

function Shown() {
  const { name } = useTheme();

  return <Text>{name}</Text>;
}

async function renderProvider() {
  const client = createTestQueryClient();
  await render(
    <QueryClientProvider client={client}>
      <UserThemeProvider>
        <Shown />
      </UserThemeProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockFetch.mockReset();
  mockStored.clear();
  mockStatus = 'restoring';
});

test('the copy on the phone shows while the session is restored', async () => {
  mockStored.set('appearance', '{"theme":"latte"}');
  await renderProvider();

  expect(await screen.findByText('latte')).toBeOnTheScreen();
});

test.each([
  ['a name that no longer exists', '{"theme":"dark","color":"nitro"}'],
  ['something unreadable', '{'],
])('a copy with %s is ignored', async (_, stored) => {
  mockStored.set('appearance', stored);
  await renderProvider();

  expect(await screen.findByText('default')).toBeOnTheScreen();
});

test('signed-out screens show Default', async () => {
  mockStatus = 'signedOut';
  mockStored.set('appearance', '{"theme":"latte"}');
  await renderProvider();

  expect(await screen.findByText('default')).toBeOnTheScreen();
});

test('the signed-in user’s theme shows, and is kept on the phone', async () => {
  mockStatus = 'ready';
  mockStored.set('appearance', '{"theme":"latte"}');
  mockFetch.mockResolvedValue(
    Response.json({
      email: 'filip@example.com',
      name: 'Filip',
      units: 'metric',
      theme: 'frost',
      timeZone: 'Europe/Zagreb',
      role: 'user',
    }),
  );
  await renderProvider();

  expect(await screen.findByText('frost')).toBeOnTheScreen();
  expect(mockStored.get('appearance')).toBe('{"theme":"frost"}');
});
