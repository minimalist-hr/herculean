import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import { ThemeProvider } from '@/theme/theme-provider';

import {
  AddToEditedWorkoutScreen,
  NewExerciseForEditedWorkoutScreen,
} from './add-to-edited-workout-screen';
import { EditWorkoutDraft, EditWorkoutScreen } from './edit-workout-screen';
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

const workout = {
  id: 'w1',
  date: '2026-11-03',
  status: 'completed',
  name: 'Legs',
  startedAtUtc: null,
  finishedAtUtc: null,
  exercises: [
    {
      id: 'we1',
      exerciseId: 'squat',
      name: 'Barbell squat',
      groupId: 'legs',
      groupName: 'Legs',
      targetSets: 2,
      targetRepsFrom: 8,
      targetRepsTo: 10,
      sets: [
        { id: 's1', order: 0, weightKg: 100, reps: 5, checked: true },
        { id: 's2', order: 1, weightKg: 100, reps: 5, checked: true },
      ],
      lastTime: null,
    },
  ],
};

function answerWith({ putStatus = 200, failedLoads = 0 } = {}) {
  let failuresLeft = failedLoads;
  mockFetch.mockImplementation((request) => {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/v1/workouts/w1' && failuresLeft > 0) {
      failuresLeft -= 1;
      return Promise.resolve(new Response(null, { status: 500 }));
    }
    if (request.method === 'PUT') {
      return Promise.resolve(
        putStatus === 200
          ? Response.json({
              id: 'w1',
              date: workout.date,
              status: 'completed',
              name: 'Legs',
            })
          : new Response(null, { status: putStatus }),
      );
    }
    if (pathname === '/api/v1/users/me') {
      return Promise.resolve(Response.json({ units: 'metric' }));
    }
    if (pathname === '/api/v1/groups') {
      return Promise.resolve(Response.json([{ id: 'legs', name: 'Legs' }]));
    }
    if (pathname === '/api/v1/exercises/lunge/last-time') {
      return Promise.resolve(
        Response.json({
          lastTime: {
            date: '2026-10-27',
            sets: [{ weightKg: 40, reps: 10 }],
          },
        }),
      );
    }
    if (pathname === '/api/v1/exercises') {
      return Promise.resolve(
        Response.json([
          {
            id: 'lunge',
            name: 'Lunge',
            groupId: 'legs',
            groupName: 'Legs',
            bestSet: null,
          },
        ]),
      );
    }
    return Promise.resolve(Response.json(workout));
  });
}

async function sentBody() {
  const request = mockFetch.mock.calls.find(
    ([sent]) => sent.method === 'PUT',
  )?.[0];

  return (await request?.clone().json()) as unknown;
}

function Layout() {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <ThemeProvider theme="dark">
        <Stack screenOptions={{ headerShown: false }} />
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function Day() {
  const router = useRouter();

  return (
    <Text
      accessibilityRole="button"
      onPress={() => {
        router.push('/workout/edit/w1');
      }}
    >
      Day screen
    </Text>
  );
}

function EditLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EditWorkoutDraft id={id} />;
}

async function renderEdit({ loaded = true } = {}) {
  await renderRouter(
    {
      _layout: Layout,
      index: Day,
      'workout/edit/[id]/_layout': EditLayout,
      'workout/edit/[id]/index': EditWorkoutScreen,
      'workout/edit/[id]/add': AddToEditedWorkoutScreen,
      'workout/edit/[id]/new-exercise': NewExerciseForEditedWorkoutScreen,
    },
    { initialUrl: '/' },
  );
  await fireEvent.press(screen.getByText('Day screen'));
  await screen.findByText('Edit workout');
  if (loaded) {
    await screen.findByText('Legs · Tue, 3rd November');
  }
}

beforeEach(() => {
  mockFetch.mockReset();
});

test('shows every exercise open, with no check boxes or swap', async () => {
  answerWith();
  await renderEdit();

  expect(screen.getByText('Legs · Tue, 3rd November')).toBeOnTheScreen();
  expect(screen.getByLabelText('Set 2 reps, 5')).toBeOnTheScreen();
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(screen.queryByLabelText('Swap Barbell squat')).toBeNull();
});

test('a changed value and an added set are saved together', async () => {
  answerWith();
  await renderEdit();

  await fireEvent.press(screen.getByLabelText('Set 1 reps, 5'));
  await screen.findByRole('button', { name: 'Save set' });
  await fireEvent.press(screen.getByRole('button', { name: '8' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save set' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Add set' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save workout' }));

  expect(await screen.findByText('Day screen')).toBeOnTheScreen();
  expect(await screen.findByText('Legs saved.')).toBeOnTheScreen();
  expect(await sentBody()).toEqual({
    exercises: [
      {
        id: 'we1',
        exerciseId: 'squat',
        sets: [
          { weightKg: 100, reps: 8 },
          { weightKg: 100, reps: 5 },
          { weightKg: 100, reps: 5 },
        ],
      },
    ],
  });
});

test('a failed save says so and stays on the page', async () => {
  answerWith({ putStatus: 500 });
  await renderEdit();

  await fireEvent.press(screen.getByRole('button', { name: 'Save workout' }));

  expect(
    await screen.findByText('Couldn’t save the workout. Try again.'),
  ).toBeOnTheScreen();
  expect(screen.getByText('Edit workout')).toBeOnTheScreen();
});

test('a removed set comes back with Undo, where it was', async () => {
  answerWith();
  await renderEdit();

  await fireEvent.press(screen.getByLabelText('Set 1 reps, 5'));
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Remove set' }),
  );

  expect(await screen.findByText('Set 1 removed.')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Set 2 reps, 5')).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

  expect(await screen.findByLabelText('Set 2 reps, 5')).toBeOnTheScreen();
});

test('removing an exercise asks first, and Undo brings it back', async () => {
  answerWith();
  await renderEdit();

  await fireEvent.press(screen.getByLabelText('Remove Barbell squat'));
  expect(
    await screen.findByText('Its 2 sets will be removed from this workout.'),
  ).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Remove exercise' }),
  );

  expect(await screen.findByText('Barbell squat removed.')).toBeOnTheScreen();
  await waitFor(() => {
    expect(screen.queryByLabelText('Set 1 reps, 5')).toBeNull();
  });

  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

  expect(await screen.findByLabelText('Set 1 reps, 5')).toBeOnTheScreen();
});

test('an added exercise shows its last time before the workout, and is saved as new', async () => {
  answerWith();
  await renderEdit();

  await fireEvent.press(screen.getByRole('button', { name: 'Add exercise' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Lunge' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Add exercise' }));
  await screen.findByText('Lunge');

  expect(await screen.findByText('40 × 10')).toBeOnTheScreen();
  expect(
    mockFetch.mock.calls.some(([sent]) =>
      sent.url.endsWith('/lunge/last-time?before=2026-11-03'),
    ),
  ).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'Save workout' }));

  expect(await screen.findByText('Day screen')).toBeOnTheScreen();
  expect(await sentBody()).toEqual({
    exercises: [
      {
        id: 'we1',
        exerciseId: 'squat',
        sets: [
          { weightKg: 100, reps: 5 },
          { weightKg: 100, reps: 5 },
        ],
      },
      {
        id: null,
        exerciseId: 'lunge',
        sets: [
          { weightKg: 0, reps: 8 },
          { weightKg: 0, reps: 8 },
          { weightKg: 0, reps: 8 },
        ],
      },
    ],
  });
});

test('shows the page while the workout loads, with no save', async () => {
  answerWith();
  const loads: (() => void)[] = [];
  const answer = mockFetch.getMockImplementation();
  mockFetch.mockImplementation((request) =>
    new URL(request.url).pathname === '/api/v1/workouts/w1'
      ? new Promise((resolve) => {
          loads.push(() => {
            resolve(Response.json(workout));
          });
        })
      : (answer?.(request) ?? Promise.reject(new Error('No answer'))),
  );
  await renderEdit({ loaded: false });

  expect(screen.getByLabelText('Loading this workout')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Save workout' })).toBeNull();

  await act(() => {
    loads.forEach((load) => {
      load();
    });
  });

  expect(
    await screen.findByRole('button', { name: 'Save workout' }),
  ).toBeOnTheScreen();
});

test('a failed load says so, and Try again loads it', async () => {
  answerWith({ failedLoads: 1 });
  await renderEdit({ loaded: false });

  expect(
    await screen.findByText('Couldn’t load this workout.'),
  ).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Save workout' })).toBeNull();

  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('Legs · Tue, 3rd November')).toBeOnTheScreen();
});

test('with every exercise removed, it says so and save is muted', async () => {
  answerWith();
  await renderEdit();

  await fireEvent.press(screen.getByLabelText('Remove Barbell squat'));
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Remove exercise' }),
  );

  expect(await screen.findByText('No exercises left')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Save workout' }));

  expect(
    await screen.findByText('Add an exercise to save, or delete the workout.'),
  ).toBeOnTheScreen();
  expect(mockFetch.mock.calls.some(([sent]) => sent.method === 'PUT')).toBe(
    false,
  );
});

test('leaving with changes asks first, and Discard changes leaves', async () => {
  answerWith();
  await renderEdit();

  await fireEvent.press(screen.getByRole('button', { name: 'Add set' }));
  await fireEvent.press(screen.getByRole('link', { name: 'Workout' }));

  expect(await screen.findByText('Discard changes?')).toBeOnTheScreen();

  await fireEvent.press(
    screen.getByRole('button', { name: 'Discard changes' }),
  );

  expect(await screen.findByText('Day screen')).toBeOnTheScreen();
});

test('leaving with no changes just leaves', async () => {
  answerWith();
  await renderEdit();

  await fireEvent.press(screen.getByRole('link', { name: 'Workout' }));

  expect(await screen.findByText('Day screen')).toBeOnTheScreen();
  expect(screen.queryByText('Discard changes?')).toBeNull();
});
