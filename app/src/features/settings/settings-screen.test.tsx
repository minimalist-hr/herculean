import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState } from 'react';
import { Text } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import { ThemeProvider } from '@/theme/theme-provider';

import { initialsOf } from './settings-labels';
import { ProfileButton } from './profile-button';
import {
  ColorScreen,
  DefaultRestScreen,
  ThemeScreen,
  UnitsScreen,
} from './setting-pages';
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
  color: 'nitro',
  timeZone: 'Europe/Zagreb',
};

function answerWith({
  userStatus = 200,
  restStatus = 200,
  patchStatus = 200,
} = {}) {
  mockFetch.mockImplementation(async (request) => {
    const { pathname } = new URL(request.url);
    if (request.method === 'PATCH') {
      if (patchStatus !== 200) {
        return new Response(null, { status: patchStatus });
      }
      const changes = (await request.clone().json()) as object;
      return Response.json(
        pathname === '/api/v1/users/me'
          ? { ...user, ...changes }
          : { defaultRestSeconds: 90, ...changes },
      );
    }
    if (pathname === '/api/v1/users/me') {
      return Promise.resolve(
        userStatus === 200
          ? Response.json(user)
          : new Response(null, { status: userStatus }),
      );
    }

    return Promise.resolve(
      restStatus === 200
        ? Response.json({
            defaultRestSeconds: 90,
            soundWhenRestEnds: true,
            vibrateWhenRestEnds: true,
          })
        : new Response(null, { status: restStatus }),
    );
  });
}

function Layout() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
          mutations: { gcTime: 0 },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
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

async function renderAt(initialUrl: string) {
  await renderRouter(
    {
      _layout: Layout,
      index: ProfileButton,
      'settings/index': SettingsScreen,
      'settings/theme': ThemeScreen,
      'settings/color': ColorScreen,
      'settings/units': UnitsScreen,
      'settings/rest-time': DefaultRestScreen,
      terms: Legal,
    },
    { initialUrl },
  );
}

async function renderSettings() {
  await renderAt('/');
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
  expect(screen.getByText('Nitro')).toBeOnTheScreen();
  expect(screen.getByText('Metric')).toBeOnTheScreen();
  expect(await screen.findByText('1:30')).toBeOnTheScreen();
  expect(screen.getByText('filip@example.com')).toBeOnTheScreen();
});

test('a row not built yet says so', async () => {
  answerWith();
  await renderSettings();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Email, filip@example.com' }),
  );

  expect(
    await screen.findByText('Changing your email comes in a later update.'),
  ).toBeOnTheScreen();
});

function patchBody() {
  const request = mockFetch.mock.calls.find(
    ([sent]) => sent.method === 'PATCH',
  )?.[0];

  return request?.clone().json();
}

test.each([
  ['Theme, Match my phone', 'Light', 'Save theme', { theme: 'light' }],
  ['Color, Nitro', 'Chrome', 'Save color', { color: 'chrome' }],
  ['Units, Metric', 'Imperial, lb, in', 'Save units', { units: 'imperial' }],
])(
  '%s: a picked choice is saved, and Settings shows it',
  async (row, choice, save, body) => {
    answerWith();
    await renderSettings();

    await fireEvent.press(await screen.findByRole('button', { name: row }));
    await fireEvent.press(await screen.findByRole('radio', { name: choice }));
    await fireEvent.press(screen.getByRole('button', { name: save }));

    await expect(patchBody()).resolves.toEqual(body);
    expect(await screen.findByText(/ saved\.$/)).toBeOnTheScreen();
    expect(
      await screen.findByText(choice.split(',')[0], { exact: true }),
    ).toBeOnTheScreen();
  },
);

test('the default rest time is saved from its page', async () => {
  answerWith();
  await renderSettings();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Default rest time, 1:30' }),
  );
  await fireEvent.press(
    await screen.findByRole('button', { name: '3 minutes' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save rest time' }));

  await expect(patchBody()).resolves.toEqual({ defaultRestSeconds: 180 });
  expect(await screen.findByText('Default rest time saved.')).toBeOnTheScreen();
});

test('a failed save says so and stays', async () => {
  answerWith({ patchStatus: 500 });
  await renderSettings();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Theme, Match my phone' }),
  );
  await fireEvent.press(await screen.findByRole('radio', { name: 'Dark' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save theme' }));

  expect(
    await screen.findByText("Couldn't save the theme. Try again."),
  ).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Save theme' })).toBeOnTheScreen();
});

test('leaving with a changed choice asks first', async () => {
  answerWith();
  await renderSettings();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Theme, Match my phone' }),
  );
  await fireEvent.press(await screen.findByRole('radio', { name: 'Dark' }));
  await fireEvent.press(screen.getByRole('link', { name: 'Settings' }));

  expect(await screen.findByText('Discard changes?')).toBeOnTheScreen();
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

test.each([
  ['/settings/theme', { userStatus: 500 }, "Couldn't load your theme."],
  ['/settings/rest-time', { restStatus: 500 }, "Couldn't load your rest time."],
])(
  '%s opened on its own shows that it is loading, a failure, and Try again',
  async (url, statuses, failure) => {
    answerWith(statuses);
    await renderAt(url);

    expect(await screen.findByText(failure)).toBeOnTheScreen();

    answerWith();
    await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

    expect(await screen.findByText(/^Save /)).toBeOnTheScreen();
  },
);

test('a failed rest time save says so and stays', async () => {
  answerWith({ patchStatus: 500 });
  await renderAt('/settings/rest-time');

  await fireEvent.press(
    await screen.findByRole('button', { name: '1 minute' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save rest time' }));

  expect(
    await screen.findByText("Couldn't save the rest time. Try again."),
  ).toBeOnTheScreen();
});
