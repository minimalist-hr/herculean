import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack, useRouter, type Href } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/button';
import { NotificationBar } from '@/components/notification-bar';
import { ThemeProvider } from '@/theme/theme-provider';

import { SwapWorkoutExerciseScreen } from './swap-workout-exercise-screen';
import { useWorkout } from './use-workout';
import { WorkoutPicksProvider } from './workout-picks';
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

const legs = { id: 'legs', name: 'Legs' };
const arms = { id: 'arms', name: 'Arms' };

function row(id: string, name: string, group = legs) {
  return { id, name, groupId: group.id, groupName: group.name, bestSet: null };
}

function inWorkout(exerciseId: string, name: string, weightKg = 80) {
  return {
    id: 'one',
    exerciseId,
    name,
    groupId: legs.id,
    groupName: legs.name,
    targetSets: 2,
    targetRepsFrom: 8,
    targetRepsTo: 10,
    sets: [
      { id: 's1', order: 0, weightKg, reps: 8, checked: false },
      { id: 's2', order: 1, weightKg, reps: 6, checked: false },
    ],
    lastTime: null,
  };
}

const workout = {
  id: 'w1',
  date: '2026-11-03',
  status: 'inProgress',
  name: 'Legs day',
  startedAtUtc: null,
  exercises: [inWorkout('squat', 'Squat')],
};

let swapping: () => Response;
const listRequests: string[] = [];

function answerWith(request: Request) {
  const url = new URL(request.url);
  if (request.method === 'PATCH') {
    return Promise.resolve(swapping());
  }
  if (url.pathname === '/api/v1/workouts/w1') {
    return Promise.resolve(Response.json(workout));
  }
  if (url.pathname === '/api/v1/groups') {
    return Promise.resolve(Response.json([legs, arms]));
  }
  if (url.pathname === '/api/v1/users/me') {
    return Promise.resolve(Response.json({ units: 'metric' }));
  }

  listRequests.push(url.search);

  return Promise.resolve(
    Response.json([
      row('squat', 'Squat'),
      row('lunge', 'Lunge'),
      row('press', 'Leg press'),
    ]),
  );
}

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

function Start() {
  const router = useRouter();
  const loaded = useWorkout('w1');
  const goTo = (page: string) => {
    router.push(`/${page}` as Href);
  };

  return (
    <>
      <Text>{loaded.data?.exercises[0].name ?? 'Loading'}</Text>
      <Button
        label="Go"
        onPress={() => {
          goTo('swap');
        }}
      />
    </>
  );
}

async function renderSwap() {
  await renderRouter(
    {
      _layout: Layout,
      index: Start,
      swap: () => (
        <WorkoutPicksProvider>
          <SwapWorkoutExerciseScreen id="w1" workoutExerciseId="one" />
        </WorkoutPicksProvider>
      ),
    },
    { initialUrl: '/' },
  );
  await screen.findByText('Squat');
  await fireEvent.press(screen.getByRole('button', { name: 'Go' }));
  await screen.findByRole('header', { name: 'Swap exercise' });
}

const hidden = { includeHiddenElements: true };

beforeEach(() => {
  listRequests.length = 0;
  swapping = () =>
    Response.json({ ...workout, exercises: [inWorkout('lunge', 'Lunge', 30)] });
  mockFetch.mockReset();
  mockFetch.mockImplementation(answerWith);
});

test('says what it replaces, starts on its group, and leaves it out', async () => {
  await renderSwap();

  expect(
    screen.getByText('Pick an exercise to do instead of Squat.'),
  ).toBeOnTheScreen();
  await waitFor(() => {
    expect(listRequests.some((search) => search.includes('legs'))).toBe(true);
  });
  expect(
    await screen.findByRole('button', { name: 'Lunge' }),
  ).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Squat' })).toBeNull();
});

test('takes one pick: a new one replaces the last', async () => {
  await renderSwap();

  await fireEvent.press(await screen.findByRole('button', { name: 'Lunge' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Leg press' }));

  expect(
    screen.getByRole('button', { name: 'Leg press', selected: true }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Lunge', selected: false }),
  ).toBeOnTheScreen();
});

test('nothing picked says why', async () => {
  await renderSwap();

  await fireEvent.press(
    screen.getAllByRole('button', { name: 'Swap exercise' })[0],
  );

  expect(await screen.findByText('Pick an exercise first.')).toBeOnTheScreen();
});

test('swaps, goes back, and Undo sends back the exercise and its values', async () => {
  await renderSwap();

  await fireEvent.press(await screen.findByRole('button', { name: 'Lunge' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Swap exercise' }));

  expect(
    await screen.findByText('Squat swapped for Lunge.', hidden),
  ).toBeOnTheScreen();
  const first = mockFetch.mock.calls.find(
    ([sent]) => sent.method === 'PATCH',
  )?.[0];
  expect(new URL(first?.url ?? '').pathname).toBe(
    '/api/v1/workouts/w1/exercises/one',
  );
  expect(await first?.clone().json()).toEqual({ exerciseId: 'lunge' });
  expect(await screen.findByText('Lunge', hidden)).toBeOnTheScreen();

  swapping = () => Response.json(workout);
  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

  await waitFor(() => {
    expect(
      mockFetch.mock.calls.filter(([sent]) => sent.method === 'PATCH'),
    ).toHaveLength(2);
  });
  const undo = mockFetch.mock.calls.filter(
    ([sent]) => sent.method === 'PATCH',
  )[1][0];
  expect(await undo.clone().json()).toEqual({
    exerciseId: 'squat',
    sets: [
      { weightKg: 80, reps: 8 },
      { weightKg: 80, reps: 6 },
    ],
  });
});

test('with nothing to pick, it says so for a swap', async () => {
  mockFetch.mockImplementation((request) =>
    new URL(request.url).pathname === '/api/v1/exercises'
      ? Promise.resolve(Response.json([row('squat', 'Squat')]))
      : answerWith(request),
  );
  await renderSwap();

  expect(await screen.findByText('No exercises to swap to')).toBeOnTheScreen();
  expect(
    screen.getByText('Try another group, or create a new exercise.'),
  ).toBeOnTheScreen();
});

test('a failed swap says so, and stays with the pick', async () => {
  swapping = () =>
    Response.json({ code: 'oops', status: 500 }, { status: 500 });
  await renderSwap();

  await fireEvent.press(await screen.findByRole('button', { name: 'Lunge' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Swap exercise' }));

  expect(
    await screen.findByText('Couldn’t swap the exercise. Try again.'),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Lunge', selected: true }),
  ).toBeOnTheScreen();
});

test('a conflict says what stands in the way', async () => {
  swapping = () =>
    Response.json(
      {
        code: 'workout.exercise_has_checked_sets',
        status: 409,
        detail:
          'An exercise with checked sets can’t be swapped. Uncheck them first.',
      },
      { status: 409 },
    );
  await renderSwap();

  await fireEvent.press(await screen.findByRole('button', { name: 'Lunge' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Swap exercise' }));

  expect(
    await screen.findByText(
      'An exercise with checked sets can’t be swapped. Uncheck them first.',
    ),
  ).toBeOnTheScreen();
});

test('a failed Undo says so', async () => {
  await renderSwap();
  await fireEvent.press(await screen.findByRole('button', { name: 'Lunge' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Swap exercise' }));
  await screen.findByText('Squat swapped for Lunge.', hidden);

  swapping = () =>
    Response.json({ code: 'oops', status: 500 }, { status: 500 });
  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

  expect(
    await screen.findByText('Couldn’t undo. Try again.'),
  ).toBeOnTheScreen();
});
