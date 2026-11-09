import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState } from 'react';
import { Text } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import { endSession, enterApp } from '@/features/account/session';
import { ThemeProvider } from '@/theme/theme-provider';

import { ConfirmEmailScreen } from './confirm-email-screen';
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

jest.mock('expo-secure-store', () => ({
  setItemAsync: () => Promise.resolve(),
  getItemAsync: () => Promise.resolve(null),
  deleteItemAsync: () => Promise.resolve(),
}));

function Layout() {
  const [client] = useState(() => createTestQueryClient());

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider theme="dark">
        <Stack screenOptions={{ headerShown: false }} />
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const stub = (name: string) =>
  function Stub() {
    return <Text>{name}</Text>;
  };

async function renderLink(url = '/confirm-email?token=abc') {
  await renderRouter(
    {
      _layout: Layout,
      'confirm-email': ConfirmEmailScreen,
      'settings/index': stub('Settings page'),
      'sign-in': stub('Sign in page'),
      launch: stub('Launch page'),
    },
    { initialUrl: url },
  );
}

const problem = (status: number, code: string, detail: string) =>
  Response.json(
    { type: 'about:blank', title: 'Error', status, detail, code, traceId: '1' },
    { status },
  );

function confirmCalls() {
  return mockFetch.mock.calls.length;
}

beforeEach(() => {
  mockFetch.mockReset();
});

test('signed in, it confirms the token once and returns to Settings', async () => {
  enterApp(true);
  mockFetch.mockResolvedValue(new Response(null, { status: 204 }));

  await renderLink();

  expect(await screen.findByText('Settings page')).toBeOnTheScreen();
  expect(await screen.findByText('Email changed.')).toBeOnTheScreen();
  expect(confirmCalls()).toBe(1);
  await expect(mockFetch.mock.calls[0]?.[0].clone().json()).resolves.toEqual({
    token: 'abc',
  });
});

test('signed out, it goes to sign in and says to use the new email', async () => {
  await endSession();
  mockFetch.mockResolvedValue(new Response(null, { status: 204 }));

  await renderLink();

  expect(await screen.findByText('Sign in page')).toBeOnTheScreen();
  expect(
    await screen.findByText('Email changed. Sign in with the new one.'),
  ).toBeOnTheScreen();
});

test('an expired link says so, with a way back', async () => {
  enterApp(true);
  mockFetch.mockResolvedValue(
    problem(404, 'user.invalid_email_change_token', 'Expired.'),
  );

  await renderLink();

  expect(await screen.findByText('Link expired')).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Back to Settings' }),
  );
  expect(await screen.findByText('Settings page')).toBeOnTheScreen();
});

test('signed out, an expired link goes back to sign in', async () => {
  await endSession();
  mockFetch.mockResolvedValue(
    problem(404, 'user.invalid_email_change_token', 'Expired.'),
  );

  await renderLink();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Go to sign in' }),
  );
  expect(await screen.findByText('Sign in page')).toBeOnTheScreen();
});

test('an address taken meanwhile says so', async () => {
  enterApp(true);
  mockFetch.mockResolvedValue(
    problem(
      409,
      'user.email_taken',
      'An account with this email already exists.',
    ),
  );

  await renderLink();

  expect(await screen.findByText('Email taken')).toBeOnTheScreen();
  expect(
    screen.getByText('An account with this email already exists.'),
  ).toBeOnTheScreen();
});

test('a link without a token counts as expired and sends nothing', async () => {
  enterApp(true);

  await renderLink('/confirm-email');

  expect(await screen.findByText('Link expired')).toBeOnTheScreen();
  expect(confirmCalls()).toBe(0);
});

test.each([
  [true, 'Back to Settings', 'Settings page'],
  [false, 'Go to sign in', 'Sign in page'],
])(
  'a failure can be left (signed in: %s)',
  async (signedIn, button, destination) => {
    if (signedIn) {
      enterApp(true);
    } else {
      await endSession();
    }
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));

    await renderLink();
    await screen.findByText("Couldn't confirm your email.");
    await fireEvent.press(screen.getByRole('button', { name: button }));

    expect(await screen.findByText(destination)).toBeOnTheScreen();
  },
);

test('no connection offers Try again, which confirms', async () => {
  enterApp(true);
  mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));
  mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

  await renderLink();

  expect(
    await screen.findByText("Couldn't confirm your email."),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('Settings page')).toBeOnTheScreen();
});
