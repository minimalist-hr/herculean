import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState } from 'react';
import { Text } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import { saveTokens } from '@/features/account/session';
import { ThemeProvider } from '@/theme/theme-provider';

import { ChangePasswordScreen } from './change-password-screen';
import { initialsOf } from './settings-labels';
import { ProfileButton } from './profile-button';
import {
  ColorScreen,
  DefaultRestScreen,
  NameScreen,
  ThemeScreen,
  UnitsScreen,
} from './setting-pages';
import { SettingsScreen } from './settings-screen';

const mockFetch = jest.fn<Promise<Response>, [Request]>();
const mockRefreshTokens = jest.fn<Promise<boolean>, []>();

jest.mock('@/api/client', () => {
  const createClient =
    jest.requireActual<typeof import('openapi-fetch')>('openapi-fetch').default;
  return {
    api: createClient({
      baseUrl: 'http://api.test',
      fetch: (request: Request) => mockFetch(request),
    }),
    refreshTokens: () => mockRefreshTokens(),
  };
});

jest.mock('expo-secure-store', () => {
  const stored = new Map<string, string>();
  return {
    setItemAsync: (key: string, value: string) =>
      Promise.resolve(void stored.set(key, value)),
    getItemAsync: (key: string) => Promise.resolve(stored.get(key) ?? null),
    deleteItemAsync: (key: string) => Promise.resolve(void stored.delete(key)),
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
  patchProblem,
}: {
  userStatus?: number;
  restStatus?: number;
  patchStatus?: number;
  patchProblem?: object;
} = {}) {
  mockFetch.mockImplementation(async (request) => {
    const { pathname } = new URL(request.url);
    if (request.method === 'PATCH') {
      if (patchProblem !== undefined) {
        return Response.json(patchProblem, { status: 400 });
      }
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
      'settings/name': NameScreen,
      'settings/password': ChangePasswordScreen,
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
  ['/settings/name', { userStatus: 500 }, "Couldn't load your name."],
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

test('the name is saved trimmed, and Settings shows it', async () => {
  answerWith();
  await renderSettings();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Name, Filip Mučnjak' }),
  );
  await fireEvent.changeText(
    await screen.findByLabelText('Your name'),
    ' Filip M ',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save name' }));

  await expect(patchBody()).resolves.toEqual({ name: 'Filip M' });
  expect(await screen.findByText('Name saved.')).toBeOnTheScreen();
  expect(
    await screen.findByRole('button', { name: 'Name, Filip M' }),
  ).toBeOnTheScreen();
});

test('an empty name shows an error under the field and saves nothing', async () => {
  answerWith();
  await renderAt('/settings/name');

  await fireEvent.changeText(await screen.findByLabelText('Your name'), '   ');
  await fireEvent.press(screen.getByRole('button', { name: 'Save name' }));

  expect(await screen.findByText('Enter your name.')).toBeOnTheScreen();
  expect(patchBody()).toBeUndefined();
});

test('a name the API rejects shows its message under the field', async () => {
  answerWith({
    patchProblem: {
      type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
      title: 'Bad Request',
      status: 400,
      detail: 'One or more fields are not valid.',
      code: 'validation',
      errors: { name: ["'Name' must have 1 to 50 characters."] },
      traceId: '00-1',
    },
  });
  await renderAt('/settings/name');

  await fireEvent.changeText(
    await screen.findByLabelText('Your name'),
    'Filip',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save name' }));

  expect(
    await screen.findByText("'Name' must have 1 to 50 characters."),
  ).toBeOnTheScreen();
});

test('a failed name save says so and stays', async () => {
  answerWith({ patchStatus: 500 });
  await renderAt('/settings/name');

  await fireEvent.changeText(
    await screen.findByLabelText('Your name'),
    'Filip',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save name' }));

  expect(
    await screen.findByText("Couldn't save the name. Try again."),
  ).toBeOnTheScreen();
});

test('leaving with a changed name asks first', async () => {
  answerWith();
  await renderSettings();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Name, Filip Mučnjak' }),
  );
  await fireEvent.changeText(
    await screen.findByLabelText('Your name'),
    'Filip',
  );
  await fireEvent.press(screen.getByRole('link', { name: 'Settings' }));

  expect(await screen.findByText('Discard changes?')).toBeOnTheScreen();
});

function answerPasswordWith(answer: Response) {
  answerWith();
  const answerRest = mockFetch.getMockImplementation();
  mockFetch.mockImplementation((request) =>
    request.method === 'PUT'
      ? Promise.resolve(answer)
      : (answerRest?.(request) ?? Promise.reject(new Error('No answer'))),
  );
}

const validationProblem = (errors: Record<string, string[]>) =>
  Response.json(
    {
      type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
      title: 'Bad Request',
      status: 400,
      detail: 'One or more fields are not valid.',
      code: 'validation',
      errors,
      traceId: '00-1',
    },
    { status: 400 },
  );

async function fillPasswords(
  current = 'old-password',
  next = 'new-password',
  repeat = next,
) {
  await fireEvent.changeText(
    await screen.findByLabelText('Current password'),
    current,
  );
  await fireEvent.changeText(screen.getByLabelText('New password'), next);
  await fireEvent.changeText(
    screen.getByLabelText('Confirm new password'),
    repeat,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save password' }));
}

function putRequest() {
  return mockFetch.mock.calls.find(([sent]) => sent.method === 'PUT')?.[0];
}

describe('change password', () => {
  beforeEach(async () => {
    mockRefreshTokens.mockReset();
    mockRefreshTokens.mockResolvedValue(true);
    await saveTokens({
      accessToken: 'access',
      expiresIn: 900,
      refreshToken: 'this-phone',
    });
  });

  test('saves with this device’s token, after a refresh, and says other devices are signed out', async () => {
    answerPasswordWith(new Response(null, { status: 204 }));
    await renderSettings();

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Password, Change' }),
    );
    await fillPasswords();

    expect(
      await screen.findByText('Password saved. Other devices are signed out.'),
    ).toBeOnTheScreen();
    expect(mockRefreshTokens).toHaveBeenCalledTimes(1);
    await expect(putRequest()?.clone().json()).resolves.toEqual({
      currentPassword: 'old-password',
      newPassword: 'new-password',
      refreshToken: 'this-phone',
    });
  });

  test('a wrong current password shows under its field', async () => {
    answerPasswordWith(
      validationProblem({
        currentPassword: ['The current password is wrong.'],
      }),
    );
    await renderAt('/settings/password');

    await fillPasswords();

    expect(
      await screen.findByText('The current password is wrong.'),
    ).toBeOnTheScreen();
  });

  test('a new password the API rejects shows under its field', async () => {
    answerPasswordWith(
      validationProblem({ newPassword: ['That password is not allowed.'] }),
    );
    await renderAt('/settings/password');

    await fillPasswords();

    expect(
      await screen.findByText('That password is not allowed.'),
    ).toBeOnTheScreen();
  });

  test.each([
    ['', 'new-password', 'new-password', 'Enter your current password.'],
    ['old-password', 'short', 'short', 'At least 8 characters.'],
    ['old-password', 'new-password', 'other', "The passwords don't match."],
  ])(
    'with %p, %p and %p it shows %p and sends nothing',
    async (current, next, repeat, message) => {
      answerPasswordWith(new Response(null, { status: 204 }));
      await renderAt('/settings/password');

      await fillPasswords(current, next, repeat);

      expect(await screen.findByText(message)).toBeOnTheScreen();
      expect(putRequest()).toBeUndefined();
    },
  );

  test('a failed save says so and stays', async () => {
    answerPasswordWith(new Response(null, { status: 500 }));
    await renderAt('/settings/password');

    await fillPasswords();

    expect(
      await screen.findByText("Couldn't save the password. Try again."),
    ).toBeOnTheScreen();
  });

  test('a session that has ended sends nothing', async () => {
    mockRefreshTokens.mockResolvedValue(false);
    answerPasswordWith(new Response(null, { status: 204 }));
    await renderAt('/settings/password');

    await fillPasswords();

    expect(
      await screen.findByText("Couldn't save the password. Try again."),
    ).toBeOnTheScreen();
    expect(putRequest()).toBeUndefined();
  });

  test('leaving with something typed asks first', async () => {
    answerWith();
    await renderSettings();

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Password, Change' }),
    );
    await fireEvent.changeText(
      await screen.findByLabelText('Current password'),
      'old',
    );
    await fireEvent.press(screen.getByRole('link', { name: 'Settings' }));

    expect(await screen.findByText('Discard changes?')).toBeOnTheScreen();
  });
});

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
