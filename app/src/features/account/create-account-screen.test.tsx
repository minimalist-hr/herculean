import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ThemeProvider } from '@/theme/theme-provider';

import { CreateAccountScreen } from './create-account-screen';
import { privacyPolicy, termsOfService } from './legal-documents';
import { LegalScreen } from './legal-screen';
import { endSession, getAccessToken, useSessionStatus } from './session';

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

jest.mock('expo-localization', () => ({
  getCalendars: () => [{ timeZone: 'Europe/Zagreb' }],
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
            <Stack.Screen name="create-account" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'needsSetup'}>
            <Stack.Screen name="setup" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function renderCreateAccount() {
  await renderRouter(
    {
      _layout: Layout,
      'create-account': CreateAccountScreen,
      setup: () => <PlaceholderScreen title="Setup screen" />,
      terms: () => <LegalScreen document={termsOfService} />,
      privacy: () => <LegalScreen document={privacyPolicy} />,
    },
    { initialUrl: '/create-account' },
  );
}

async function fillIn(
  email: string,
  password: string,
  repeatPassword = password,
) {
  await fireEvent.changeText(screen.getByLabelText('Email'), email);
  await fireEvent.changeText(screen.getByLabelText('Password'), password);
  await fireEvent.changeText(
    screen.getByLabelText('Repeat password'),
    repeatPassword,
  );
}

async function pressCreateAccount() {
  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
}

beforeEach(async () => {
  mockFetch.mockReset();
  await endSession();
});

test('a new account is created with the phone time zone, signed in and sent to setup', async () => {
  mockFetch.mockResolvedValue(Response.json(tokens, { status: 201 }));
  await renderCreateAccount();

  await fillIn('filip@example.com', 'password');
  await pressCreateAccount();

  expect(await screen.findByText('Setup screen')).toBeOnTheScreen();
  expect(getAccessToken()).toBe('access');
  await expect(mockFetch.mock.calls[0][0].json()).resolves.toEqual({
    email: 'filip@example.com',
    password: 'password',
    timeZone: 'Europe/Zagreb',
  });
});

test('the form checks its fields before sending', async () => {
  await renderCreateAccount();

  await fillIn('filip', 'short', 'other');
  await pressCreateAccount();

  expect(await screen.findByText('Enter a valid email.')).toBeOnTheScreen();
  expect(screen.getByText('At least 8 characters.')).toBeOnTheScreen();
  expect(screen.getByText("The passwords don't match.")).toBeOnTheScreen();
  expect(mockFetch).not.toHaveBeenCalled();
});

test('a taken email shows the API message under Email', async () => {
  mockFetch.mockResolvedValue(
    Response.json(
      {
        type: 'https://tools.ietf.org/html/rfc9110#section-15.5.10',
        title: 'Conflict',
        status: 409,
        detail: 'An account with this email already exists.',
        code: 'user.email_taken',
        traceId: '00-1',
      },
      { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
    ),
  );
  await renderCreateAccount();

  await fillIn('filip@example.com', 'password');
  await pressCreateAccount();

  expect(
    await screen.findByText('An account with this email already exists.'),
  ).toBeOnTheScreen();
  expect(getAccessToken()).toBeNull();
});

test('no connection shows the general error until a field changes', async () => {
  mockFetch.mockRejectedValue(new TypeError('Network request failed'));
  await renderCreateAccount();

  await fillIn('filip@example.com', 'password');
  await pressCreateAccount();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't create the account. Try again.",
  );

  await fireEvent.changeText(
    screen.getByLabelText('Email'),
    'filip@example.org',
  );
  await waitFor(() => {
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

test('while waiting, the button says so and Sign in is dimmed', async () => {
  mockFetch.mockReturnValue(new Promise(() => undefined));
  await renderCreateAccount();

  await fillIn('filip@example.com', 'password');
  await pressCreateAccount();

  expect(await screen.findByText('Creating account')).toBeOnTheScreen();
  expect(screen.getByRole('link', { name: 'Sign in' })).toBeDisabled();
});

test.each([
  ['Terms of service', '1. Your account'],
  ['Privacy policy', '1. What we store'],
])(
  '%s opens and its back link returns to the form as it was',
  async (link, firstSection) => {
    await renderCreateAccount();
    await fireEvent.changeText(
      screen.getByLabelText('Email'),
      'filip@example.com',
    );

    await fireEvent.press(screen.getByRole('link', { name: link }));
    expect(await screen.findByText(firstSection)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('link', { name: 'Create account' }));
    expect(await screen.findByLabelText('Email')).toHaveDisplayValue(
      'filip@example.com',
    );
  },
);

test('Go on the last field creates the account', async () => {
  mockFetch.mockResolvedValue(Response.json(tokens, { status: 201 }));
  await renderCreateAccount();

  await fillIn('filip@example.com', 'password');
  await fireEvent(screen.getByLabelText('Repeat password'), 'submitEditing');

  expect(await screen.findByText('Setup screen')).toBeOnTheScreen();
});
