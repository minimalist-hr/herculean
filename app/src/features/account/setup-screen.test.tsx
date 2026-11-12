import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState } from 'react';

import { PlaceholderScreen } from '@/test-utils/placeholder-screen';
import { NotificationBar } from '@/components/notification-bar';
import { ThemeProvider } from '@/theme/theme-provider';

import { enterApp, useSessionStatus } from './session';
import { SetupScreen } from './setup-screen';
import { useUnits } from './use-units';
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

const user = {
  email: 'filip@example.com',
  name: 'Filip',
  units: 'imperial',
  timeZone: 'Europe/Zagreb',
};
const workoutSettings = {
  defaultRestSeconds: 195,
  restSound: true,
  restVibrate: true,
};

function Layout() {
  const status = useSessionStatus();
  const [client] = useState(createTestQueryClient);

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider theme="default">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={status === 'needsSetup'}>
            <Stack.Screen name="setup" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'ready'}>
            <Stack.Screen name="index" />
          </Stack.Protected>
        </Stack>
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function renderSetup() {
  await renderRouter(
    {
      _layout: Layout,
      setup: SetupScreen,
      index: () => <PlaceholderScreen title="Home screen" />,
    },
    { initialUrl: '/setup' },
  );
}

function answerEach(request: Request) {
  return Promise.resolve(
    request.url.endsWith('/users/me')
      ? Response.json(user)
      : Response.json(workoutSettings),
  );
}

async function sentBodies() {
  const bodies: Record<string, unknown> = {};
  for (const [request] of mockFetch.mock.calls) {
    bodies[new URL(request.url).pathname] = await request.json();
  }
  return bodies;
}

beforeEach(() => {
  mockFetch.mockReset();
  enterApp(false);
});

test('finishing setup saves the name, units and rest time, then opens Home', async () => {
  mockFetch.mockImplementation(answerEach);
  await renderSetup();

  await fireEvent.changeText(screen.getByLabelText('Name'), ' Filip ');
  await fireEvent.press(screen.getByRole('radio', { name: 'Imperial, lb' }));
  await fireEvent.press(
    screen.getByRole('button', { name: '15 seconds more' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Finish setup' }));

  expect(await screen.findByText('Home screen')).toBeOnTheScreen();
  await expect(sentBodies()).resolves.toEqual({
    '/api/v1/users/me': { name: 'Filip', units: 'imperial' },
    '/api/v1/workout-settings': { defaultRestSeconds: 195 },
  });
});

test('the first screen after setup already knows the units', async () => {
  function Units() {
    return <PlaceholderScreen title={`Units: ${useUnits()}`} />;
  }
  // The read never answers, so the units can only come from saving setup.
  mockFetch.mockImplementation((request) =>
    request.method === 'GET'
      ? new Promise<Response>(() => undefined)
      : answerEach(request),
  );
  await renderRouter(
    { _layout: Layout, setup: SetupScreen, index: Units },
    { initialUrl: '/setup' },
  );

  await fireEvent.changeText(screen.getByLabelText('Name'), 'Filip');
  await fireEvent.press(screen.getByRole('button', { name: 'Finish setup' }));

  expect(await screen.findByText('Units: imperial')).toBeOnTheScreen();
});

test('setup starts at metric and 3:00, with the 3:00 pick filled', async () => {
  await renderSetup();

  expect(screen.getByRole('radio', { name: 'Metric, kg' })).toBeChecked();
  expect(
    screen.getByRole('adjustable', { name: 'Default rest time' }),
  ).toHaveAccessibilityValue({ text: '3 minutes' });
  expect(screen.getByRole('button', { name: '3 minutes' })).toBeSelected();
  expect(screen.getByRole('button', { name: '1 minute' })).not.toBeSelected();
});

test('a time between the picks fills none of them', async () => {
  await renderSetup();

  await fireEvent.press(
    screen.getByRole('button', { name: '15 seconds more' }),
  );

  for (const minutes of [
    '1 minute',
    '2 minutes',
    '3 minutes',
    '4 minutes',
    '5 minutes',
  ]) {
    expect(screen.getByRole('button', { name: minutes })).not.toBeSelected();
  }
});

test('a quick pick sets the rest time and is filled', async () => {
  await renderSetup();

  await fireEvent.press(screen.getByRole('button', { name: '4 minutes' }));

  expect(
    screen.getByRole('adjustable', { name: 'Default rest time' }),
  ).toHaveAccessibilityValue({ text: '4 minutes' });
  expect(screen.getByRole('button', { name: '4 minutes' })).toBeSelected();
});

test('a name is needed before anything is sent', async () => {
  await renderSetup();

  await fireEvent.press(screen.getByRole('button', { name: 'Finish setup' }));

  expect(await screen.findByText('Enter your name.')).toBeOnTheScreen();
  expect(mockFetch).not.toHaveBeenCalled();
});

test('a name the API rejects shows its message under Name', async () => {
  mockFetch.mockImplementation((request) =>
    request.url.endsWith('/users/me')
      ? Promise.resolve(
          Response.json(
            {
              type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
              title: 'Bad Request',
              status: 400,
              detail: 'One or more fields are not valid.',
              code: 'validation',
              errors: { name: ["'Name' must have 1 to 50 characters."] },
              traceId: '00-1',
            },
            { status: 400 },
          ),
        )
      : answerEach(request),
  );
  await renderSetup();

  await fireEvent.changeText(screen.getByLabelText('Name'), 'Filip');
  await fireEvent.press(screen.getByRole('button', { name: 'Finish setup' }));

  expect(
    await screen.findByText("'Name' must have 1 to 50 characters."),
  ).toBeOnTheScreen();
  await waitFor(() => {
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

test('no connection shows a notification', async () => {
  mockFetch.mockRejectedValue(new TypeError('Network request failed'));
  await renderSetup();

  await fireEvent.changeText(screen.getByLabelText('Name'), 'Filip');
  await fireEvent.press(screen.getByRole('button', { name: 'Finish setup' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Couldn’t finish setup. Try again.',
  );
});

test('while waiting, the button says so', async () => {
  mockFetch.mockReturnValue(new Promise(() => undefined));
  await renderSetup();

  await fireEvent.changeText(screen.getByLabelText('Name'), 'Filip');
  await fireEvent.press(screen.getByRole('button', { name: 'Finish setup' }));

  expect(await screen.findByText('Finishing setup')).toBeOnTheScreen();
});

test('a failed rest time save shows a notification, so both are sent again', async () => {
  mockFetch.mockImplementation((request) =>
    request.url.endsWith('/users/me')
      ? answerEach(request)
      : Promise.resolve(new Response('Bad Gateway', { status: 502 })),
  );
  await renderSetup();

  await fireEvent.changeText(screen.getByLabelText('Name'), 'Filip');
  await fireEvent.press(screen.getByRole('button', { name: 'Finish setup' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Couldn’t finish setup. Try again.',
  );
});
