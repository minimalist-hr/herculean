import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { PlaceholderScreen } from '@/test-utils/placeholder-screen';
import { NotificationBar } from '@/components/notification-bar';
import { ThemeProvider } from '@/theme/theme-provider';

import { NewPasswordScreen } from './new-password-screen';
import { ResetLinkSentScreen } from './reset-link-sent-screen';
import { ResetPasswordScreen } from './reset-password-screen';
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

const expiredMessage = 'This link has expired. Send a new one.';

function Layout() {
  return (
    <QueryClientProvider
      client={
        // The default keeps a timer running for five minutes, which holds Jest open.
        createTestQueryClient()
      }
    >
      <ThemeProvider theme="default">
        <Stack screenOptions={{ headerShown: false }} />
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function renderAt(initialUrl: string) {
  await renderRouter(
    {
      _layout: Layout,
      'sign-in': () => <PlaceholderScreen title="Sign in screen" />,
      'forgot-password': ResetPasswordScreen,
      'reset-link-sent': ResetLinkSentScreen,
      'new-password': NewPasswordScreen,
    },
    { initialUrl },
  );
}

function answerNoContent(status: number) {
  mockFetch.mockImplementation(() =>
    Promise.resolve(new Response(null, { status })),
  );
}

function problem(status: number, code: string, detail: string) {
  return Response.json(
    {
      type: 'https://tools.ietf.org/html/rfc9110',
      title: 'Error',
      status,
      detail,
      code,
      traceId: '00-1',
    },
    { status },
  );
}

async function press(name: string) {
  await fireEvent.press(screen.getByRole('button', { name }));
}

async function fillInPasswords(password: string, repeatPassword: string) {
  await fireEvent.changeText(screen.getByLabelText('New password'), password);
  await fireEvent.changeText(
    screen.getByLabelText('Confirm new password'),
    repeatPassword,
  );
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('reset password', () => {
  test('sending the link opens the link sent screen with the email', async () => {
    answerNoContent(202);
    await renderAt('/forgot-password');

    await fireEvent.changeText(
      screen.getByLabelText('Email'),
      ' filip+1@example.com ',
    );
    await press('Send reset link');

    expect(await screen.findByText('Check your email')).toBeOnTheScreen();
    expect(
      screen.getByText('Reset link sent to filip+1@example.com'),
    ).toBeOnTheScreen();
    await expect(mockFetch.mock.calls[0][0].json()).resolves.toEqual({
      email: 'filip+1@example.com',
    });
  });

  test('an invalid email is stopped before anything is sent', async () => {
    await renderAt('/forgot-password');

    await fireEvent.changeText(screen.getByLabelText('Email'), 'not-an-email');
    await press('Send reset link');

    expect(await screen.findByText('Enter a valid email.')).toBeOnTheScreen();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('no connection shows a notification until the email changes', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));
    await renderAt('/forgot-password');

    await fireEvent.changeText(
      screen.getByLabelText('Email'),
      'filip@example.com',
    );
    await press('Send reset link');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Couldn’t send the link. Try again.',
    );

    await fireEvent.changeText(
      screen.getByLabelText('Email'),
      'other@example.com',
    );

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  test('an expired link shows its line until the email changes', async () => {
    await renderAt('/forgot-password?linkExpired=true');

    expect(await screen.findByRole('alert')).toHaveTextContent(expiredMessage);

    await fireEvent.changeText(
      screen.getByLabelText('Email'),
      'filip@example.com',
    );

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  test('the back link opens sign in', async () => {
    await renderAt('/forgot-password');

    await fireEvent.press(screen.getByRole('link', { name: 'Sign in' }));

    expect(await screen.findByText('Sign in screen')).toBeOnTheScreen();
  });

  test('with an email typed, the back link asks first', async () => {
    await renderAt('/forgot-password');
    await fireEvent.changeText(
      screen.getByLabelText('Email'),
      'filip@example.com',
    );

    await fireEvent.press(screen.getByRole('link', { name: 'Sign in' }));
    await press('Discard changes');

    expect(await screen.findByText('Sign in screen')).toBeOnTheScreen();
  });

  test('after sending, leaving from the next page does not ask', async () => {
    answerNoContent(204);
    await renderAt('/forgot-password');
    await fireEvent.changeText(
      screen.getByLabelText('Email'),
      'filip@example.com',
    );

    await press('Send reset link');
    await screen.findByText('Check your email');
    await fireEvent.press(screen.getByRole('link', { name: 'Sign in' }));

    expect(await screen.findByText('Sign in screen')).toBeOnTheScreen();
    expect(screen.queryByText('Discard changes?')).toBeNull();
  });
});

describe('link sent', () => {
  const url = '/reset-link-sent?email=filip%40example.com';
  const waitMs = 60_000;

  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function waitOut() {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(waitMs);
    });
  }

  test('sending again waits a minute from when the screen opens', async () => {
    await renderAt(url);

    await press('Send link again in 1:00');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Wait a moment before sending it again.',
    );

    await waitOut();

    expect(
      screen.getByRole('button', { name: 'Send link again' }),
    ).toBeEnabled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('sending again sends the same email, says so and waits again', async () => {
    answerNoContent(202);
    await renderAt(url);
    await waitOut();

    await press('Send link again');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Link sent again.',
    );
    await expect(mockFetch.mock.calls[0][0].json()).resolves.toEqual({
      email: 'filip@example.com',
    });
    expect(
      screen.getByRole('button', { name: 'Send link again in 1:00' }),
    ).toBeOnTheScreen();
  });

  test('a failed send shows a notification and can be tried right away', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));
    await renderAt(url);
    await waitOut();

    await press('Send link again');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Couldn’t send the link. Try again.',
    );
    expect(
      screen.getByRole('button', { name: 'Send link again' }),
    ).toBeEnabled();
  });

  test('the back link opens sign in', async () => {
    await renderAt(url);

    await fireEvent.press(screen.getByRole('link', { name: 'Sign in' }));

    expect(await screen.findByText('Sign in screen')).toBeOnTheScreen();
  });
});

describe('new password', () => {
  const url = '/new-password?token=a-token&email=filip%40example.com';

  test('shows who the link is for', async () => {
    await renderAt(url);

    expect(screen.getByText('For filip@example.com.')).toBeOnTheScreen();
  });

  test('saving sends the token and the password, then opens sign in', async () => {
    answerNoContent(204);
    await renderAt(url);

    await fillInPasswords('new-password', 'new-password');
    await press('Save password');

    expect(await screen.findByText('Sign in screen')).toBeOnTheScreen();
    await expect(mockFetch.mock.calls[0][0].json()).resolves.toEqual({
      token: 'a-token',
      password: 'new-password',
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Password changed. Sign in with the new one.',
    );
  });

  test('a short password and a different repeat are stopped before anything is sent', async () => {
    await renderAt(url);

    await fillInPasswords('short', 'other');
    await press('Save password');

    expect(await screen.findByText('At least 8 characters.')).toBeOnTheScreen();
    expect(screen.getByText('The passwords don’t match.')).toBeOnTheScreen();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('a link that expired while typing shows the API message', async () => {
    mockFetch.mockResolvedValue(
      problem(404, 'user.invalid_password_reset_token', expiredMessage),
    );
    await renderAt(url);

    await fillInPasswords('new-password', 'new-password');
    await press('Save password');

    expect(await screen.findByRole('alert')).toHaveTextContent(expiredMessage);
    expect(
      screen.queryByText('Password changed. Sign in with the new one.'),
    ).toBeNull();
  });

  test('no connection shows a notification until a field changes', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));
    await renderAt(url);

    await fillInPasswords('new-password', 'new-password');
    await press('Save password');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Couldn’t save the password. Try again.',
    );

    await fireEvent.changeText(
      screen.getByLabelText('New password'),
      'another-password',
    );

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  test('the back link opens sign in', async () => {
    await renderAt(url);

    await fireEvent.press(screen.getByRole('link', { name: 'Sign in' }));

    expect(await screen.findByText('Sign in screen')).toBeOnTheScreen();
    expect(
      screen.queryByText('Password changed. Sign in with the new one.'),
    ).toBeNull();
  });

  test('a link without a token opens reset password with the expired line', async () => {
    await renderAt('/new-password');

    expect(await screen.findByRole('alert')).toHaveTextContent(expiredMessage);
    expect(screen.getByText('Reset password')).toBeOnTheScreen();
  });
});
