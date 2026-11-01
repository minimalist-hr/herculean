import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ThemeProvider } from '@/theme/theme-provider';

import { LaunchScreen } from './launch-screen';
import { endSession, saveTokens, useSessionStatus } from './session';

jest.mock('expo-secure-store', () => {
  const stored = new Map<string, string>();
  return {
    setItemAsync: jest.fn((key: string, value: string) =>
      Promise.resolve(void stored.set(key, value)),
    ),
    getItemAsync: jest.fn((key: string) =>
      Promise.resolve(stored.get(key) ?? null),
    ),
    deleteItemAsync: jest.fn((key: string) =>
      Promise.resolve(void stored.delete(key)),
    ),
  };
});

function Status() {
  return <Text>{useSessionStatus()}</Text>;
}

async function renderLaunch() {
  await render(
    <QueryClientProvider
      client={
        // No cleanup timer after the test, so Jest can exit.
        new QueryClient({ defaultOptions: { mutations: { gcTime: Infinity } } })
      }
    >
      <ThemeProvider theme="dark">
        <LaunchScreen />
        <Status />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

function answerSignedIn() {
  jest.spyOn(globalThis, 'fetch').mockImplementation((input) =>
    Promise.resolve(
      new URL((input as Request).url).pathname === '/api/v1/users/me'
        ? Response.json({
            email: 'filip@example.com',
            name: 'Filip',
            units: 'metric',
            timeZone: 'Europe/Zagreb',
          })
        : Response.json({
            accessToken: 'access 2',
            expiresIn: 900,
            refreshToken: 'refresh 2',
          }),
    ),
  );
}

beforeEach(() =>
  saveTokens({
    accessToken: 'access',
    expiresIn: 900,
    refreshToken: 'refresh',
  }),
);

afterEach(async () => {
  jest.restoreAllMocks();
  await endSession();
});

test('the logo shows while the stored session is restored', async () => {
  answerSignedIn();
  await renderLaunch();

  expect(screen.getByRole('image', { name: 'Herculean' })).toBeOnTheScreen();
  expect(await screen.findByText('ready')).toBeOnTheScreen();
});

test('no connection offers to try again, which restores the session', async () => {
  jest
    .spyOn(globalThis, 'fetch')
    .mockRejectedValue(new TypeError('Network request failed'));
  await renderLaunch();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't connect.",
  );

  answerSignedIn();
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('ready')).toBeOnTheScreen();
  expect(screen.queryByRole('alert')).toBeNull();
});
