import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { NotificationBar } from '@/components/notification-bar';
import { dragBy } from '@/test-utils/drag';
import { ThemeProvider } from '@/theme/theme-provider';

import { ReorderScreen } from './reorder-screen';
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

function exercise(id: string, name: string, groupId: string, checked: number) {
  return {
    id,
    exerciseId: `${id}-exercise`,
    name,
    groupId,
    groupName: groupId,
    targetSets: 2,
    targetRepsFrom: 8,
    targetRepsTo: 10,
    sets: [0, 1].map((order) => ({
      id: `${id}-${String(order)}`,
      order,
      weightKg: 80,
      reps: 8,
      checked: order < checked,
    })),
    lastTime: null,
    supersetWithNext: false,
  };
}

const workout = {
  id: 'w1',
  date: '2026-11-03',
  status: 'inProgress',
  name: 'Legs day',
  startedAtUtc: null as string | null,
  exercises: [
    exercise('squat', 'Barbell squat', 'Legs', 1),
    exercise('press', 'Leg press', 'Legs', 0),
    exercise('curl', 'Curl', 'Arms', 0),
  ],
};

let saving: 'ok' | 'fail' = 'ok';
let loading: 'ok' | 'fail' = 'ok';

function answerWith(request: Request) {
  if (request.method === 'PUT') {
    return Promise.resolve(
      saving === 'ok'
        ? new Response(null, { status: 204 })
        : Response.json({ code: 'oops', status: 500 }, { status: 500 }),
    );
  }

  return Promise.resolve(
    loading === 'ok'
      ? Response.json(workout)
      : Response.json({ code: 'oops', status: 500 }, { status: 500 }),
  );
}

function Layout() {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <ThemeProvider theme="default">
        <Stack screenOptions={{ headerShown: false }} />
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function renderReorder() {
  await renderRouter(
    { _layout: Layout, index: () => <ReorderScreen id="w1" /> },
    { initialUrl: '/' },
  );
}

const order = () =>
  screen
    .getAllByRole('button', { name: /^Move / })
    .map((handle) => handle.props.accessibilityLabel as string);

beforeEach(() => {
  saving = 'ok';
  loading = 'ok';
  mockFetch.mockReset();
  mockFetch.mockImplementation(answerWith);
});

test('shows the exercises with their progress, and no Save button', async () => {
  await renderReorder();

  expect(await screen.findByText('Legs day')).toBeOnTheScreen();
  expect(screen.getByText('Reorder exercises')).toBeOnTheScreen();
  expect(
    screen.getByText(
      'Drag the handle to move an exercise. Logged sets stay with it.',
    ),
  ).toBeOnTheScreen();
  expect(screen.getByText('1/2')).toBeOnTheScreen();
  expect(order()).toEqual([
    'Move Barbell squat',
    'Move Leg press',
    'Move Curl',
  ]);
  expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
});

test('shows the running time when it has one', async () => {
  workout.startedAtUtc = new Date(Date.now() - 400_000).toISOString();

  try {
    await renderReorder();

    expect(await screen.findByText(/^Legs day · 6:4/)).toBeOnTheScreen();
  } finally {
    workout.startedAtUtc = null;
  }
});

test('a drop moves the exercise and saves the new order', async () => {
  await renderReorder();
  await screen.findByText('Legs day');

  await dragBy(screen.getByRole('button', { name: 'Move Barbell squat' }), 70);

  await waitFor(() => {
    expect(order()).toEqual([
      'Move Leg press',
      'Move Barbell squat',
      'Move Curl',
    ]);
  });
  const request = mockFetch.mock.calls.find(
    ([sent]) => sent.method === 'PUT',
  )?.[0];
  expect(new URL(request?.url ?? '').pathname).toBe(
    '/api/v1/workouts/w1/exercise-order',
  );
  expect(await request?.clone().json()).toEqual({
    workoutExerciseIds: ['press', 'squat', 'curl'],
  });
});

test('a superset moves as one', async () => {
  mockFetch.mockImplementation((request) =>
    request.method === 'GET'
      ? Promise.resolve(
          Response.json({
            ...workout,
            exercises: [
              { ...workout.exercises[0], supersetWithNext: true },
              ...workout.exercises.slice(1),
            ],
          }),
        )
      : answerWith(request),
  );
  await renderReorder();
  await screen.findByText('Legs day');

  await dragBy(screen.getByRole('button', { name: 'Move Barbell squat' }), 70);

  await waitFor(() => {
    expect(order()).toEqual([
      'Move Curl',
      'Move Barbell squat',
      'Move Leg press',
    ]);
  });
});

test('a failed save says so and puts the order back', async () => {
  saving = 'fail';
  await renderReorder();
  await screen.findByText('Legs day');

  await dragBy(screen.getByRole('button', { name: 'Move Barbell squat' }), 70);

  expect(
    await screen.findByText('Couldn’t save the order. Try again.'),
  ).toBeOnTheScreen();
  await waitFor(() => {
    expect(order()).toEqual([
      'Move Barbell squat',
      'Move Leg press',
      'Move Curl',
    ]);
  });
});

test('a failed load offers to try again', async () => {
  loading = 'fail';
  await renderReorder();

  expect(
    await screen.findByText('Couldn’t load this workout.'),
  ).toBeOnTheScreen();

  loading = 'ok';
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('Reorder exercises')).toBeOnTheScreen();
});

test('while it loads, the title and hint are already in place', async () => {
  mockFetch.mockImplementation(() => new Promise(() => undefined));
  await renderReorder();

  expect(screen.getByLabelText('Loading this workout')).toBeOnTheScreen();
  expect(
    screen.getByRole('header', { name: 'Reorder exercises' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByText(
      'Drag the handle to move an exercise. Logged sets stay with it.',
    ),
  ).toBeOnTheScreen();
});
