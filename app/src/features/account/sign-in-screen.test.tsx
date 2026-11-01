import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ThemeProvider } from '@/theme/theme-provider';

import { endSession, getAccessToken, useSessionStatus } from './session';
import { SignInScreen } from './sign-in-screen';

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
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

const tokens = {
  accessToken: 'access',
  expiresIn: 900,
  refreshToken: 'refresh',
};

function Layout() {
  const status = useSessionStatus();
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <ThemeProvider theme="dark">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={status === 'signedOut'}>
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="create-account" />
            <Stack.Screen name="forgot-password" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'needsSetup'}>
            <Stack.Screen name="setup" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'ready'}>
            <Stack.Screen name="index" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function renderSignIn() {
  await renderRouter(
    {
      _layout: Layout,
      'sign-in': SignInScreen,
      'create-account': () => (
        <PlaceholderScreen title="Create account screen" />
      ),
      'forgot-password': () => (
        <PlaceholderScreen title="Reset password screen" back="Sign in" />
      ),
      setup: () => <PlaceholderScreen title="Setup screen" />,
      index: () => <PlaceholderScreen title="Home screen" />,
    },
    { initialUrl: '/sign-in' },
  );
}

/** Answers sign in with tokens, and the current user with this name. */
function answerSignIn(name: string | null) {
  mockFetch.mockImplementation((request) =>
    Promise.resolve(
      request.url.endsWith('/users/me')
        ? Response.json({
            email: 'filip@example.com',
            name,
            units: 'metric',
            timeZone: 'Europe/Zagreb',
          })
        : Response.json(tokens),
    ),
  );
}

async function fillIn(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText('Email'), email);
  await fireEvent.changeText(screen.getByLabelText('Password'), password);
}

async function pressSignIn() {
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
}

beforeEach(async () => {
  mockFetch.mockReset();
  await endSession();
});

test('signing in opens Home for a user who finished setup', async () => {
  answerSignIn('Filip');
  await renderSignIn();

  await fillIn('filip@example.com', 'password');
  await pressSignIn();

  expect(await screen.findByText('Home screen')).toBeOnTheScreen();
  expect(getAccessToken()).toBe('access');
  await expect(mockFetch.mock.calls[0][0].json()).resolves.toEqual({
    email: 'filip@example.com',
    password: 'password',
  });
});

test('signing in opens setup for a user without a name', async () => {
  answerSignIn(null);
  await renderSignIn();

  await fillIn('filip@example.com', 'password');
  await pressSignIn();

  expect(await screen.findByText('Setup screen')).toBeOnTheScreen();
});

test('both fields are needed before anything is sent', async () => {
  await renderSignIn();

  await pressSignIn();

  expect(await screen.findByText('Enter your email.')).toBeOnTheScreen();
  expect(screen.getByText('Enter your password.')).toBeOnTheScreen();
  expect(mockFetch).not.toHaveBeenCalled();
});

test('a wrong email or password shows the API message', async () => {
  mockFetch.mockResolvedValue(
    Response.json(
      {
        type: 'https://tools.ietf.org/html/rfc9110#section-15.5.2',
        title: 'Unauthorized',
        status: 401,
        detail: 'Email or password is wrong.',
        code: 'user.invalid_credentials',
        traceId: '00-1',
      },
      { status: 401 },
    ),
  );
  await renderSignIn();

  await fillIn('filip@example.com', 'wrong password');
  await pressSignIn();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Email or password is wrong.',
  );
  expect(getAccessToken()).toBeNull();
});

test('no connection shows the general error until a field changes', async () => {
  mockFetch.mockRejectedValue(new TypeError('Network request failed'));
  await renderSignIn();

  await fillIn('filip@example.com', 'password');
  await pressSignIn();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't sign in. Try again.",
  );

  await fireEvent.changeText(screen.getByLabelText('Password'), 'passwords');
  await waitFor(() => {
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

test('while waiting, the button says so and the links are dimmed', async () => {
  mockFetch.mockReturnValue(new Promise(() => undefined));
  await renderSignIn();

  await fillIn('filip@example.com', 'password');
  await pressSignIn();

  expect(await screen.findByText('Signing in')).toBeOnTheScreen();
  expect(screen.getByRole('link', { name: 'Create account' })).toBeDisabled();
  expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeDisabled();
});

test('Go on the password signs in', async () => {
  answerSignIn('Filip');
  await renderSignIn();

  await fillIn('filip@example.com', 'password');
  await fireEvent(screen.getByLabelText('Password'), 'submitEditing');

  expect(await screen.findByText('Home screen')).toBeOnTheScreen();
});

test('the links open create account and reset password', async () => {
  await renderSignIn();

  await fireEvent.press(screen.getByRole('link', { name: 'Forgot password?' }));
  expect(await screen.findByText('Reset password screen')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('link', { name: 'Sign in' }));
  await fireEvent.press(
    await screen.findByRole('link', { name: 'Create account' }),
  );
  expect(await screen.findByText('Create account screen')).toBeOnTheScreen();
});
