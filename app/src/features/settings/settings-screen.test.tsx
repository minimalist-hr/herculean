import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import { ThemeProvider } from '@/theme/theme-provider';

import { initialsOf } from './settings-labels';
import { ProfileButton } from './profile-button';
import { SettingsScreen } from './settings-screen';

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

const user = {
  email: 'filip@example.com',
  name: 'Filip Mučnjak',
  units: 'metric',
  theme: 'matchPhone',
  color: 'racingBlue',
  timeZone: 'Europe/Zagreb',
};

function answerWith({ userStatus = 200 } = {}) {
  mockFetch.mockImplementation((request) => {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/v1/users/me') {
      return Promise.resolve(
        userStatus === 200
          ? Response.json(user)
          : new Response(null, { status: userStatus }),
      );
    }

    return Promise.resolve(
      Response.json({
        defaultRestSeconds: 90,
        soundWhenRestEnds: true,
        vibrateWhenRestEnds: true,
      }),
    );
  });
}

function Layout() {
  return (
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { gcTime: 0 },
          },
        })
      }
    >
      <ThemeProvider theme="dark">
        <Stack screenOptions={{ headerShown: false }} />
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function Legal() {
  const { back } = useLocalSearchParams<{ back: string }>();

  return <Text>{`Terms, back to ${back}`}</Text>;
}

async function renderSettings() {
  await renderRouter(
    {
      _layout: Layout,
      index: ProfileButton,
      settings: SettingsScreen,
      terms: Legal,
    },
    { initialUrl: '/' },
  );
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Profile and settings' }),
  );
  await screen.findByText('Settings');
}

beforeEach(() => {
  mockFetch.mockReset();
});

test('the avatar shows the initials and opens Settings with every value', async () => {
  answerWith();
  await renderSettings();

  expect(await screen.findByText('Match my phone')).toBeOnTheScreen();
  expect(screen.getByText('Racing blue')).toBeOnTheScreen();
  expect(screen.getByText('Metric')).toBeOnTheScreen();
  expect(await screen.findByText('1:30')).toBeOnTheScreen();
  expect(screen.getByText('filip@example.com')).toBeOnTheScreen();
});

test('a row not built yet says so', async () => {
  answerWith();
  await renderSettings();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Theme, Match my phone' }),
  );

  expect(
    await screen.findByText('Theme comes in a later update.'),
  ).toBeOnTheScreen();
});

test('Terms of service opens with a back link to Settings', async () => {
  answerWith();
  await renderSettings();

  await fireEvent.press(
    screen.getByRole('button', { name: 'Terms of service' }),
  );

  expect(await screen.findByText('Terms, back to Settings')).toBeOnTheScreen();
});

test('a failed load says so in place of the profile', async () => {
  answerWith({ userStatus: 500 });
  await renderSettings();

  expect(
    await screen.findByText("Couldn't load your settings."),
  ).toBeOnTheScreen();
});

test.each([
  ['Filip Mučnjak', 'FM'],
  ['Filip', 'F'],
  ['  ', 'F'],
  [null, 'F'],
])('the initials of %p are %p', (name, initials) => {
  expect(initialsOf(name, 'filip@example.com')).toBe(initials);
});
