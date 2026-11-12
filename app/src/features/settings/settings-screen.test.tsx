import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState } from 'react';
import { Text } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import {
  getAccessToken,
  readRefreshToken,
  saveTokens,
} from '@/features/account/session';
import { ThemeProvider } from '@/theme/theme-provider';

import { ChangeEmailScreen } from './change-email-screen';
import { ChangePasswordScreen } from './change-password-screen';
import { initialsOf } from './settings-labels';
import { ProfileButton } from './profile-button';
import { DefaultRestScreen, NameScreen, UnitsScreen } from './setting-pages';
import { SettingsScreen } from './settings-screen';
import { ThemesScreen } from './themes-screen';
import { createTestQueryClient } from '@/test-utils/query-client';

import { shareFile } from './share-file';

jest.mock('./share-file', () => ({
  shareFile: jest.fn(() => Promise.resolve()),
}));

const mockFetch = jest.fn<Promise<Response>, [Request]>();
const mockRefreshTokens = jest.fn<Promise<boolean>, []>();
const mockPickPhoto = jest.fn<Promise<unknown>, [string]>();

jest.mock('./pick-photo', () => ({
  pickPhoto: (source: string) => mockPickPhoto(source),
}));

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
  theme: 'default',
  timeZone: 'Europe/Zagreb',
};

function answerWith({
  restStatus = 200,
  patchStatus = 200,
  patchProblem,
  unreadFeedback = 0,
}: {
  restStatus?: number;
  patchStatus?: number;
  patchProblem?: object;
  unreadFeedback?: number;
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
          : {
              defaultRestSeconds: 90,
              restSound: true,
              restVibrate: true,
              ...changes,
            },
      );
    }
    if (pathname === '/api/v1/users/me') {
      return Promise.resolve(Response.json(user));
    }
    if (pathname === '/api/v1/feedback/unread') {
      return Promise.resolve(Response.json({ count: unreadFeedback }));
    }

    return Promise.resolve(
      restStatus === 200
        ? Response.json({
            defaultRestSeconds: 90,
            restSound: true,
            restVibrate: true,
          })
        : new Response(null, { status: restStatus }),
    );
  });
}

function Layout() {
  const [client] = useState(() => createTestQueryClient());

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider theme="default">
        <Stack screenOptions={{ headerShown: false }} />
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function FeedbackPage() {
  return <Text>Your feedback page</Text>;
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
      'settings/theme': () => <ThemesScreen />,
      'settings/units': UnitsScreen,
      'settings/rest-time': DefaultRestScreen,
      'settings/name': NameScreen,
      'settings/password': ChangePasswordScreen,
      'settings/email': ChangeEmailScreen,
      terms: Legal,
      'settings/feedback/index': FeedbackPage,
    },
    { initialUrl },
  );
}

async function renderSettings() {
  await renderAt('/');
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Profile and settings' }),
  );
  await screen.findByRole('header', { name: 'Profile' });
}

beforeEach(() => {
  mockFetch.mockReset();
});

test('the avatar shows the initials and opens Profile with every value', async () => {
  answerWith();
  await renderSettings();

  expect(
    await screen.findByRole('button', { name: 'Themes, Default' }),
  ).toBeOnTheScreen();
  expect(screen.getByText('Metric')).toBeOnTheScreen();
  expect(await screen.findByText('1:30')).toBeOnTheScreen();
  expect(screen.getByText('filip@example.com')).toBeOnTheScreen();
});

function patchBody() {
  const request = mockFetch.mock.calls.find(
    ([sent]) => sent.method === 'PATCH',
  )?.[0];

  return request?.clone().json();
}

test.each([
  ['Units, Metric', 'Imperial, lb', 'Save units', { units: 'imperial' }],
])(
  '%s: a picked choice is saved, and Profile shows it',
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

test('without an unread reply, nothing shows a dot', async () => {
  answerWith();
  await renderSettings();

  expect(
    await screen.findByRole('button', { name: 'Feedback' }),
  ).toBeOnTheScreen();
  expect(screen.queryByTestId('unread-dot')).not.toBeOnTheScreen();
});

test('an unread feedback reply shows a dot on the avatar and on Feedback, which opens Your feedback', async () => {
  answerWith({ unreadFeedback: 1 });
  await renderAt('/');

  await fireEvent.press(
    await screen.findByRole('button', {
      name: 'Profile and settings, new feedback reply',
    }),
  );
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Feedback, new reply' }),
  );

  expect(await screen.findByText('Your feedback page')).toBeOnTheScreen();
});

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
    await screen.findByRole('button', { name: 'Units, Metric' }),
  );
  await fireEvent.press(
    await screen.findByRole('radio', { name: 'Imperial, lb' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save units' }));

  expect(
    await screen.findByText('Couldn’t save the units. Try again.'),
  ).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Save units' })).toBeOnTheScreen();
});

test('leaving with a changed choice asks first', async () => {
  answerWith();
  await renderSettings();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Units, Metric' }),
  );
  await fireEvent.press(
    await screen.findByRole('radio', { name: 'Imperial, lb' }),
  );
  await fireEvent.press(screen.getByRole('link', { name: 'Profile' }));

  expect(await screen.findByText('Discard changes?')).toBeOnTheScreen();
});

test('Themes shows the dark and light themes, with the one in use selected', async () => {
  answerWith();
  await renderSettings();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Themes, Default' }),
  );

  expect(
    await screen.findByRole('radio', { name: 'Default, selected' }),
  ).toBeChecked();
  expect(screen.getByRole('header', { name: 'Dark' })).toBeOnTheScreen();
  expect(screen.getByRole('header', { name: 'Light' })).toBeOnTheScreen();
  expect(screen.getAllByRole('radio')).toHaveLength(8);
});

test('a tapped theme is used at once, without a Save button', async () => {
  answerWith();
  await renderSettings();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Themes, Default' }),
  );
  await fireEvent.press(await screen.findByRole('radio', { name: 'Latte' }));

  expect(
    await screen.findByRole('radio', { name: 'Latte, selected' }),
  ).toBeChecked();
  await expect(patchBody()).resolves.toEqual({ theme: 'latte' });
  expect(screen.queryByRole('button', { name: /^Save/ })).toBeNull();
});

test('a theme that fails to save goes back to the one before, and says so (H96)', async () => {
  answerWith({ patchStatus: 500 });
  await renderSettings();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Themes, Default' }),
  );
  await fireEvent.press(await screen.findByRole('radio', { name: 'Frost' }));

  expect(
    await screen.findByText('Couldn’t save the theme. Try again.'),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('radio', { name: 'Default, selected' }),
  ).toBeChecked();
});

test('Terms of service opens with a back link to Profile', async () => {
  answerWith();
  await renderSettings();

  await fireEvent.press(
    screen.getByRole('button', { name: 'Terms of service' }),
  );

  expect(await screen.findByText('Terms, back to Profile')).toBeOnTheScreen();
});

test.each([
  ['Filip Mučnjak', 'FM'],
  ['Filip', 'F'],
  ['  ', 'F'],
  [null, 'F'],
])('the initials of %p are %p', (name, initials) => {
  expect(initialsOf(name, 'filip@example.com')).toBe(initials);
});

test('the rest time page shows a failure and Try again', async () => {
  answerWith({ restStatus: 500 });
  await renderAt('/settings/rest-time');

  expect(
    await screen.findByText('Couldn’t load your rest time.'),
  ).toBeOnTheScreen();

  answerWith();
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText(/^Save /)).toBeOnTheScreen();
});

test('the rest time page keeps Save in place, muted, until it has loaded', async () => {
  const label = 'Save rest time';
  answerWith({ restStatus: 500 });
  await renderAt('/settings/rest-time');

  expect(screen.getByRole('button', { name: label })).toHaveStyle({
    opacity: 0.5,
  });

  await screen.findByRole('link', { name: 'Try again' });
  const save = screen.getByRole('button', { name: label });
  expect(save).toHaveStyle({ opacity: 0.5 });
  await fireEvent.press(save);

  expect(
    await screen.findByText('This page hasn’t loaded yet.'),
  ).toBeOnTheScreen();
  expect(
    mockFetch.mock.calls.filter(([request]) => request.method !== 'GET'),
  ).toHaveLength(0);
});

test('the name is saved trimmed, and Profile shows it', async () => {
  answerWith();
  await renderSettings();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Name, Filip Mučnjak' }),
  );
  await fireEvent.changeText(await screen.findByLabelText('Name'), ' Filip M ');
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

  await fireEvent.changeText(await screen.findByLabelText('Name'), '   ');
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

  await fireEvent.changeText(await screen.findByLabelText('Name'), 'Filip');
  await fireEvent.press(screen.getByRole('button', { name: 'Save name' }));

  expect(
    await screen.findByText("'Name' must have 1 to 50 characters."),
  ).toBeOnTheScreen();
});

test('a failed name save says so and stays', async () => {
  answerWith({ patchStatus: 500 });
  await renderAt('/settings/name');

  await fireEvent.changeText(await screen.findByLabelText('Name'), 'Filip');
  await fireEvent.press(screen.getByRole('button', { name: 'Save name' }));

  expect(
    await screen.findByText('Couldn’t save the name. Try again.'),
  ).toBeOnTheScreen();
});

test('leaving with a changed name asks first', async () => {
  answerWith();
  await renderSettings();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Name, Filip Mučnjak' }),
  );
  await fireEvent.changeText(await screen.findByLabelText('Name'), 'Filip');
  await fireEvent.press(screen.getByRole('link', { name: 'Profile' }));

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
      await screen.findByText(
        'Password changed. Other devices are signed out.',
      ),
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
    ['old-password', 'new-password', 'other', 'The passwords don’t match.'],
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
      await screen.findByText('Couldn’t save the password. Try again.'),
    ).toBeOnTheScreen();
  });

  test('a session that has ended sends nothing', async () => {
    mockRefreshTokens.mockResolvedValue(false);
    answerPasswordWith(new Response(null, { status: 204 }));
    await renderAt('/settings/password');

    await fillPasswords();

    expect(
      await screen.findByText('Couldn’t save the password. Try again.'),
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
    await fireEvent.press(screen.getByRole('link', { name: 'Profile' }));

    expect(await screen.findByText('Discard changes?')).toBeOnTheScreen();
  });
});

describe('profile photo', () => {
  const photoPath = '/api/v1/users/me/photo';

  function answerPhotoWith({
    image = null as string | null,
    save = () => new Response(null, { status: 204 }),
    remove = () => new Response(null, { status: 204 }),
  } = {}) {
    answerWith();
    const answerRest = mockFetch.getMockImplementation();
    mockFetch.mockImplementation((sent) => {
      if (new URL(sent.url).pathname !== photoPath) {
        return answerRest?.(sent) ?? Promise.reject(new Error('No answer'));
      }
      if (sent.method === 'PUT') {
        return Promise.resolve(save());
      }
      if (sent.method === 'DELETE') {
        return Promise.resolve(remove());
      }

      return Promise.resolve(Response.json({ image }));
    });
  }

  function sentWith(method: string) {
    return mockFetch.mock.calls.find(
      ([sent]) =>
        sent.method === method && new URL(sent.url).pathname === photoPath,
    )?.[0];
  }

  async function openSheet(link: string) {
    await fireEvent.press(await screen.findByRole('link', { name: link }));
    await screen.findByText('Profile photo');
  }

  beforeEach(() => {
    mockPickPhoto.mockReset();
    mockPickPhoto.mockResolvedValue({ kind: 'picked', image: 'new-photo' });
  });

  test('a picked photo is saved and says so', async () => {
    answerPhotoWith();
    await renderSettings();
    await openSheet('Add photo');

    await fireEvent.press(screen.getByRole('button', { name: 'Take photo' }));

    expect(await screen.findByText('Photo saved.')).toBeOnTheScreen();
    expect(mockPickPhoto).toHaveBeenCalledWith('camera');
    await expect(sentWith('PUT')?.clone().json()).resolves.toEqual({
      image: 'new-photo',
    });
    expect(
      await screen.findByRole('link', { name: 'Change photo' }),
    ).toBeOnTheScreen();
  });

  test('denied access says where to allow it', async () => {
    mockPickPhoto.mockResolvedValue({ kind: 'denied' });
    answerPhotoWith();
    await renderSettings();
    await openSheet('Add photo');

    await fireEvent.press(
      screen.getByRole('button', { name: 'Choose from library' }),
    );

    expect(
      await screen.findByText('Allow photo access in your phone’s settings.'),
    ).toBeOnTheScreen();
    expect(sentWith('PUT')).toBeUndefined();
  });

  test('cancelling saves nothing', async () => {
    mockPickPhoto.mockResolvedValue({ kind: 'cancelled' });
    answerPhotoWith();
    await renderSettings();
    await openSheet('Add photo');

    await fireEvent.press(screen.getByRole('button', { name: 'Take photo' }));

    await waitFor(() => {
      expect(mockPickPhoto).toHaveBeenCalled();
    });
    expect(sentWith('PUT')).toBeUndefined();
  });

  test.each([
    [
      'a failed upload',
      () => {
        answerPhotoWith({
          save: () => new Response(null, { status: 500 }),
        });
      },
    ],
    [
      'a photo that cannot be read',
      () => {
        mockPickPhoto.mockRejectedValue(new Error('Unreadable'));
        answerPhotoWith();
      },
    ],
  ])('%s says so', async (_, arrange) => {
    arrange();
    await renderSettings();
    await openSheet('Add photo');

    await fireEvent.press(screen.getByRole('button', { name: 'Take photo' }));

    expect(
      await screen.findByText('Couldn’t save the photo. Try again.'),
    ).toBeOnTheScreen();
  });

  test('with no photo, Remove says why and sends nothing', async () => {
    answerPhotoWith();
    await renderSettings();
    await openSheet('Add photo');

    await fireEvent.press(screen.getByRole('button', { name: 'Remove photo' }));

    expect(
      await screen.findByText('There is no photo to remove.'),
    ).toBeOnTheScreen();
    expect(sentWith('DELETE')).toBeUndefined();
  });

  test('Remove can be undone with the same photo', async () => {
    answerPhotoWith({ image: 'old-photo' });
    await renderSettings();
    await openSheet('Change photo');

    await fireEvent.press(screen.getByRole('button', { name: 'Remove photo' }));

    expect(await screen.findByText('Photo removed.')).toBeOnTheScreen();
    expect(
      await screen.findByRole('link', { name: 'Add photo' }),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Undo'));

    expect(
      await screen.findByRole('link', { name: 'Change photo' }),
    ).toBeOnTheScreen();
    await expect(sentWith('PUT')?.clone().json()).resolves.toEqual({
      image: 'old-photo',
    });
  });

  test('a failed Remove says so', async () => {
    answerPhotoWith({
      image: 'old-photo',
      remove: () => new Response(null, { status: 500 }),
    });
    await renderSettings();
    await openSheet('Change photo');

    await fireEvent.press(screen.getByRole('button', { name: 'Remove photo' }));

    expect(
      await screen.findByText('Couldn’t remove the photo. Try again.'),
    ).toBeOnTheScreen();
  });
});

describe('sign out and delete account', () => {
  beforeEach(async () => {
    await saveTokens({
      accessToken: 'access',
      expiresIn: 900,
      refreshToken: 'this-phone',
    });
  });

  function answerRequestWith(method: string, answer: () => Promise<Response>) {
    answerWith();
    const answerRest = mockFetch.getMockImplementation();
    mockFetch.mockImplementation((request) =>
      request.method === method
        ? answer()
        : (answerRest?.(request) ?? Promise.reject(new Error('No answer'))),
    );
  }

  function sent(method: string) {
    return mockFetch.mock.calls.find(([call]) => call.method === method)?.[0];
  }

  async function openSheet(row: string) {
    await fireEvent.press(await screen.findByRole('button', { name: row }));
  }

  async function confirmSignOut() {
    await openSheet('Sign out');
    const [, button] = await screen.findAllByRole('button', {
      name: 'Sign out',
    });
    await fireEvent.press(button);
  }

  async function fillAndDelete(password: string) {
    await openSheet('Delete account');
    await fireEvent.changeText(
      await screen.findByLabelText('Current password'),
      password,
    );
    const [, button] = screen.getAllByRole('button', {
      name: 'Delete account',
    });
    await fireEvent.press(button);
  }

  test('Sign out asks first and sends nothing until confirmed', async () => {
    answerWith();
    await renderSettings();

    await openSheet('Sign out');

    expect(await screen.findByText('Sign out?')).toBeOnTheScreen();
    expect(sent('POST')).toBeUndefined();
  });

  test('confirming revokes this device’s token and forgets it', async () => {
    answerRequestWith('POST', () =>
      Promise.resolve(new Response(null, { status: 204 })),
    );
    await renderSettings();

    await confirmSignOut();

    await waitFor(() => {
      expect(getAccessToken()).toBeNull();
    });
    await expect(readRefreshToken()).resolves.toBeNull();
    await expect(sent('POST')?.clone().json()).resolves.toEqual({
      refreshToken: 'this-phone',
    });
  });

  test('without a connection it still signs out on the phone', async () => {
    answerRequestWith('POST', () => Promise.reject(new Error('No connection')));
    await renderSettings();

    await confirmSignOut();

    await waitFor(() => {
      expect(getAccessToken()).toBeNull();
    });
    await expect(readRefreshToken()).resolves.toBeNull();
  });

  test('deleting sends the password, signs out and says so', async () => {
    answerRequestWith('DELETE', () =>
      Promise.resolve(new Response(null, { status: 204 })),
    );
    await renderSettings();

    await fillAndDelete('password');

    expect(
      await screen.findByText('Account will be deleted in 14 days.'),
    ).toBeOnTheScreen();
    await expect(sent('DELETE')?.clone().json()).resolves.toEqual({
      currentPassword: 'password',
    });
    await expect(readRefreshToken()).resolves.toBeNull();
  });

  test('an empty password shows under the field and sends nothing', async () => {
    answerWith();
    await renderSettings();

    await fillAndDelete('');

    expect(
      await screen.findByText('Enter your current password.'),
    ).toBeOnTheScreen();
    expect(sent('DELETE')).toBeUndefined();
  });

  test('a wrong password shows under the field and keeps the session', async () => {
    answerRequestWith('DELETE', () =>
      Promise.resolve(
        validationProblem({
          currentPassword: ['The current password is wrong.'],
        }),
      ),
    );
    await renderSettings();

    await fillAndDelete('wrong');

    expect(
      await screen.findByText('The current password is wrong.'),
    ).toBeOnTheScreen();
    await expect(readRefreshToken()).resolves.toBe('this-phone');
  });

  test('a failed delete says so and keeps the session', async () => {
    answerRequestWith('DELETE', () =>
      Promise.resolve(new Response(null, { status: 500 })),
    );
    await renderSettings();

    await fillAndDelete('password');

    expect(
      await screen.findByText('Couldn’t delete your account. Try again.'),
    ).toBeOnTheScreen();
    await expect(readRefreshToken()).resolves.toBe('this-phone');
  });
});

describe('change email', () => {
  const pendingPath = '/api/v1/email-changes/pending';
  const requestPath = '/api/v1/email-changes';
  const resendPath = '/api/v1/email-changes/resend';
  const waitingRow = 'Email, filip@example.com, Waiting for confirmation';

  async function openWaitingPage() {
    await fireEvent.press(
      await screen.findByRole('button', { name: waitingRow }),
    );
    await screen.findByText(/^We sent a link to /);
  }

  function answerEmailWith({
    pending = null as string | null,
    request = () => new Response(null, { status: 202 }),
    resend = () => new Response(null, { status: 202 }),
  } = {}) {
    answerWith();
    const answerRest = mockFetch.getMockImplementation();
    mockFetch.mockImplementation((sent) => {
      const { pathname } = new URL(sent.url);
      if (pathname === pendingPath) {
        return Promise.resolve(Response.json({ newEmail: pending }));
      }
      if (pathname === requestPath) {
        return Promise.resolve(request());
      }
      if (pathname === resendPath) {
        return Promise.resolve(resend());
      }

      return answerRest?.(sent) ?? Promise.reject(new Error('No answer'));
    });
  }

  function sentTo(pathname: string) {
    return mockFetch.mock.calls.find(
      ([sent]) => new URL(sent.url).pathname === pathname,
    )?.[0];
  }

  async function fillEmail(newEmail: string, password = 'password') {
    await fireEvent.changeText(await screen.findByLabelText('Email'), newEmail);
    await fireEvent.changeText(
      screen.getByLabelText('Current password'),
      password,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Save email' }));
  }

  test('saves, says the link is sent and shows it waiting on Settings', async () => {
    answerEmailWith();
    await renderSettings();

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Email, filip@example.com' }),
    );
    await fillEmail(' New@Example.com ');

    expect(
      await screen.findByText('Link sent to New@Example.com.'),
    ).toBeOnTheScreen();
    await expect(sentTo(requestPath)?.clone().json()).resolves.toEqual({
      newEmail: 'New@Example.com',
      currentPassword: 'password',
    });
    expect(
      await screen.findByRole('button', { name: waitingRow }),
    ).toBeOnTheScreen();
  });

  test.each([
    ['not-an-email', 'password', 'Enter a valid email.'],
    ['new@example.com', '', 'Enter your current password.'],
  ])(
    'with %p and %p it shows %p and sends nothing',
    async (email, password, message) => {
      answerEmailWith();
      await renderAt('/settings/email');

      await fillEmail(email, password);

      expect(await screen.findByText(message)).toBeOnTheScreen();
      expect(sentTo(requestPath)).toBeUndefined();
    },
  );

  test.each([
    [
      'taken',
      () =>
        Response.json(
          {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
            detail: 'An account with this email already exists.',
            code: 'user.email_taken',
            traceId: '1',
          },
          { status: 409 },
        ),
      'An account with this email already exists.',
    ],
    [
      'wrong password',
      () =>
        validationProblem({
          currentPassword: ['The current password is wrong.'],
        }),
      'The current password is wrong.',
    ],
    [
      'the same email',
      () => validationProblem({ newEmail: ['That’s already your email.'] }),
      'That’s already your email.',
    ],
  ])('%s shows under its field', async (_, request, message) => {
    answerEmailWith({ request });
    await renderAt('/settings/email');

    await fillEmail('new@example.com');

    expect(await screen.findByText(message)).toBeOnTheScreen();
  });

  test('a failed save says so, and typing clears it', async () => {
    answerEmailWith({ request: () => new Response(null, { status: 500 }) });
    await renderAt('/settings/email');

    await fillEmail('new@example.com');

    expect(
      await screen.findByText('Couldn’t send the link. Try again.'),
    ).toBeOnTheScreen();

    await fireEvent.changeText(
      screen.getByLabelText('Email'),
      'other@example.com',
    );

    await waitFor(() => {
      expect(
        screen.queryByText('Couldn’t send the link. Try again.'),
      ).toBeNull();
    });
  });

  test('Send again sends, then asks to wait', async () => {
    answerEmailWith({ pending: 'new@example.com' });
    await renderSettings();

    await openWaitingPage();
    expect(
      screen.getByText(/^We sent a link to new@example\.com\./),
    ).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Send link again' }),
    );

    expect(await screen.findByText('Link sent again.')).toBeOnTheScreen();
    await fireEvent.press(
      await screen.findByRole('button', { name: /^Send link again in / }),
    );
    expect(
      await screen.findByText('Wait a moment before sending it again.'),
    ).toBeOnTheScreen();
    expect(
      mockFetch.mock.calls.filter(
        ([sent]) => new URL(sent.url).pathname === resendPath,
      ),
    ).toHaveLength(1);
  });

  test('a failed Send again says so', async () => {
    answerEmailWith({
      pending: 'new@example.com',
      resend: () => new Response(null, { status: 500 }),
    });
    await renderSettings();

    await openWaitingPage();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Send link again' }),
    );

    expect(
      await screen.findByText('Couldn’t send the link. Try again.'),
    ).toBeOnTheScreen();
  });

  test('the form stays below the waiting message', async () => {
    answerEmailWith({ pending: 'new@example.com' });
    await renderSettings();

    await openWaitingPage();

    expect(screen.getByText('Waiting for confirmation')).toBeOnTheScreen();
    expect(screen.getByLabelText('Email')).toBeOnTheScreen();
  });

  test('with nothing waiting, the row is plain and the page has no message', async () => {
    answerEmailWith();
    await renderSettings();

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Email, filip@example.com' }),
    );

    await screen.findByLabelText('Email');
    expect(screen.queryByText('Waiting for confirmation')).toBeNull();
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
    await screen.findByText('Couldn’t save the rest time. Try again.'),
  ).toBeOnTheScreen();
});

/** Answers the export and the photo, and everything else as before. */
function answerExport(status = 200) {
  const answerRest = mockFetch.getMockImplementation();
  mockFetch.mockImplementation((request) => {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/v1/export') {
      return Promise.resolve(
        status === 200
          ? Response.json({ exercises: [], routines: [], workouts: [] })
          : new Response(null, { status }),
      );
    }
    if (pathname === '/api/v1/users/me/photo') {
      return Promise.resolve(Response.json({ image: null }));
    }
    if (pathname === '/api/v1/feedback/export') {
      return Promise.resolve(Response.json({ tickets: [] }));
    }

    return answerRest === undefined
      ? Promise.resolve(new Response(null, { status: 404 }))
      : answerRest(request);
  });
}

test('Export data shares a zip of the data', async () => {
  answerWith();
  answerExport();
  await renderSettings();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Export data' }),
  );

  await waitFor(() => {
    expect(shareFile).toHaveBeenCalledWith(
      expect.stringMatching(/^herculean-export-\d{4}-\d{2}-\d{2}\.zip$/),
      expect.any(Uint8Array),
    );
  });
  expect(await screen.findByText('Data exported.')).toBeOnTheScreen();
});

test('an export that fails says so', async () => {
  answerWith();
  answerExport(500);
  await renderSettings();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Export data' }),
  );

  expect(
    await screen.findByText('Couldn’t export your data. Try again.'),
  ).toBeOnTheScreen();
});

/** A rest alert switch once the settings have loaded. */
async function loadedSwitch(name: string) {
  await waitFor(() => {
    expect(screen.getByRole('switch', { name })).toBeChecked();
  });

  return screen.getByRole('switch', { name });
}

test('the rest alert switches show the settings and save at once', async () => {
  answerWith();
  await renderSettings();

  await fireEvent.press(await loadedSwitch('Sound when rest ends'));

  await waitFor(() => {
    expect(
      screen.getByRole('switch', { name: 'Sound when rest ends' }),
    ).not.toBeChecked();
  });
  await waitFor(() => {
    expect(
      mockFetch.mock.calls.some(([request]) => request.method === 'PATCH'),
    ).toBe(true);
  });
});

test('a rest alert that fails to save goes back and says so', async () => {
  answerWith({ patchStatus: 500 });
  await renderSettings();

  await fireEvent.press(await loadedSwitch('Vibrate when rest ends'));

  expect(
    await screen.findByText('Couldn’t save the setting. Try again.'),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('switch', { name: 'Vibrate when rest ends' }),
  ).toBeChecked();
});
