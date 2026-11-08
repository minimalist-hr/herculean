import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

import { UserThemeProvider } from './user-theme-provider';

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
  const { scheme, colors } = useTheme();

  return <Text>{`${scheme} ${colors.primary}`}</Text>;
}

async function renderProvider() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { gcTime: 0 },
    },
  });
  await render(
    <QueryClientProvider client={client}>
      <UserThemeProvider>
        <Shown />
      </UserThemeProvider>
    </QueryClientProvider>,
  );
}

const nitroDark = `dark ${tokens.color.accent.nitro.dark.primary}`;
const chromeLight = `light ${tokens.color.accent.chrome.light.primary}`;

beforeEach(() => {
  mockFetch.mockReset();
  mockStored.clear();
  mockStatus = 'signedOut';
});

test('the copy on the phone shows before anyone is signed in', async () => {
  mockStored.set('appearance', '{"theme":"light","color":"chrome"}');
  await renderProvider();

  expect(await screen.findByText(chromeLight)).toBeOnTheScreen();
});

test.each([
  ['a name that no longer exists', '{"theme":"dark","color":"racingBlue"}'],
  ['something unreadable', '{'],
])('a copy with %s is ignored', async (_, stored) => {
  mockStored.set('appearance', stored);
  await renderProvider();

  // The default, in whichever scheme the phone has.
  const nitro = tokens.color.accent.nitro;
  expect(
    await screen.findByText(
      new RegExp(`${nitro.dark.primary}|${nitro.light.primary}`),
    ),
  ).toBeOnTheScreen();
  expect(screen.queryByText(chromeLight)).toBeNull();
});

test("the signed-in user's theme and color show, and are kept on the phone", async () => {
  mockStatus = 'ready';
  mockStored.set('appearance', '{"theme":"light","color":"chrome"}');
  mockFetch.mockResolvedValue(
    Response.json({
      email: 'filip@example.com',
      name: 'Filip',
      units: 'metric',
      theme: 'dark',
      color: 'nitro',
      timeZone: 'Europe/Zagreb',
    }),
  );
  await renderProvider();

  expect(await screen.findByText(nitroDark)).toBeOnTheScreen();
  expect(mockStored.get('appearance')).toBe('{"theme":"dark","color":"nitro"}');
});
