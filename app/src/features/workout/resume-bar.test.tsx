import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { ThemeProvider } from '@/theme/theme-provider';

import { ResumeBar } from './resume-bar';
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

const inProgress = {
  id: 'w1',
  date: '2026-11-06',
  status: 'inProgress',
  name: 'Chest and arms 2',
};

function workout(startedAtUtc: string | null) {
  return {
    ...inProgress,
    startedAtUtc,
    finishedAtUtc: null,
    exercises: [
      {
        sets: [
          { id: 's1', order: 0, weightKg: 40, reps: 10, checked: true },
          { id: 's2', order: 1, weightKg: 40, reps: 10, checked: false },
          { id: 's3', order: 2, weightKg: 40, reps: 10, checked: false },
        ],
      },
    ],
  };
}

function answerWith({
  list = [inProgress],
  listStatus = 200,
  startedAtUtc = null,
}: {
  list?: unknown[];
  listStatus?: number;
  startedAtUtc?: string | null;
} = {}) {
  mockFetch.mockImplementation((request) => {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/v1/workouts') {
      return Promise.resolve(
        listStatus === 200
          ? Response.json(list)
          : new Response(null, { status: listStatus }),
      );
    }
    return Promise.resolve(Response.json(workout(startedAtUtc)));
  });
}

let queryClient: QueryClient;

function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme="default">
        <Stack screenOptions={{ headerShown: false }} />
        <ResumeBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function renderBar(initialUrl = '/') {
  await renderRouter(
    {
      _layout: Layout,
      index: () => <Text>Home screen</Text>,
      'workout/log/[id]': () => <Text>Logging</Text>,
      'workout/edit/[id]': () => <Text>Edit workout</Text>,
    },
    { initialUrl },
  );
}

beforeEach(() => {
  queryClient = createTestQueryClient();
  mockFetch.mockReset();
  jest.useRealTimers();
});

test('shows the workout in progress with its sets and Resume', async () => {
  answerWith();

  await renderBar();

  expect(await screen.findByText('Chest and arms 2')).toBeOnTheScreen();
  expect(screen.getByText('1 of 3 sets')).toBeOnTheScreen();
  const [request] = mockFetch.mock.calls[0];
  expect(new URL(request.url).search).toBe('?status=inProgress');
});

test('adds the time since it started', async () => {
  jest.useFakeTimers({ now: new Date('2026-11-06T18:06:40Z') });
  answerWith({ startedAtUtc: '2026-11-06T18:00:00Z' });

  await renderBar();

  expect(await screen.findByText('1 of 3 sets · 6:40')).toBeOnTheScreen();
});

test('Resume opens logging, where the bar hides', async () => {
  answerWith();
  await renderBar();

  await fireEvent.press(await screen.findByRole('button', { name: 'Resume' }));

  expect(await screen.findByText('Logging')).toBeOnTheScreen();
  expect(screen.queryByText('Chest and arms 2')).not.toBeOnTheScreen();
});

test('stays hidden while editing a workout', async () => {
  answerWith();
  await renderBar('/workout/edit/w2');

  expect(await screen.findByText('Edit workout')).toBeOnTheScreen();
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalled();
  });
  expect(screen.queryByText('Chest and arms 2')).not.toBeOnTheScreen();
});

test('stays hidden when no workout is in progress', async () => {
  answerWith({ list: [] });

  await renderBar();

  expect(await screen.findByText('Home screen')).toBeOnTheScreen();
  expect(
    screen.queryByRole('button', { name: 'Resume' }),
  ).not.toBeOnTheScreen();
});

test('stays hidden when it fails to load', async () => {
  answerWith({ listStatus: 500 });

  await renderBar();

  expect(await screen.findByText('Home screen')).toBeOnTheScreen();
  expect(
    screen.queryByRole('button', { name: 'Resume' }),
  ).not.toBeOnTheScreen();
});

test('hides to a small button with the sets, which shows it again', async () => {
  answerWith();
  await renderBar();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Hide workout bar' }),
  );

  expect(screen.queryByText('Chest and arms 2')).not.toBeOnTheScreen();
  expect(screen.getByText('1/3')).toBeOnTheScreen();

  await fireEvent.press(
    screen.getByRole('button', { name: 'Show workout, 1 of 3 sets' }),
  );

  expect(screen.getByText('Chest and arms 2')).toBeOnTheScreen();
});
