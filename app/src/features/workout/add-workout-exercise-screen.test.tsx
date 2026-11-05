import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack, useRouter, type Href } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/button';
import { NotificationBar } from '@/components/notification-bar';
import { ThemeProvider } from '@/theme/theme-provider';

import { AddWorkoutExerciseScreen } from './add-workout-exercise-screen';
import { WorkoutPicksProvider } from './workout-picks';

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

function row(id: string, name: string) {
  return { id, name, groupId: legs.id, groupName: legs.name, bestSet: null };
}

function inWorkout(exerciseId: string, name: string) {
  return {
    id: `in-${exerciseId}`,
    exerciseId,
    name,
    groupId: legs.id,
    groupName: legs.name,
    targetSets: 3,
    targetRepsFrom: 8,
    targetRepsTo: 10,
    sets: [],
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

let adding: () => Response;

function answerWith(request: Request) {
  const { pathname } = new URL(request.url);
  if (pathname === '/api/v1/workouts/w1/exercises') {
    return Promise.resolve(adding());
  }
  if (pathname === '/api/v1/workouts/w1') {
    return Promise.resolve(Response.json(workout));
  }
  if (pathname === '/api/v1/groups') {
    return Promise.resolve(Response.json([legs]));
  }
  if (pathname === '/api/v1/users/me') {
    return Promise.resolve(Response.json({ units: 'metric' }));
  }

  return Promise.resolve(
    Response.json([
      row('squat', 'Squat'),
      row('lunge', 'Lunge'),
      row('press', 'Leg press'),
    ]),
  );
}

function Layout() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: Infinity } },
      }),
  );

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
  const queryClient = useQueryClient();
  const names = queryClient.getQueryData<typeof workout>(['workout', 'w1']);
  const goTo = (page: string) => {
    router.push(`/${page}` as Href);
  };

  return (
    <>
      <Text>Logging screen</Text>
      <Text>{names?.exercises.map((item) => item.name).join(', ')}</Text>
      <Button
        label="Go"
        onPress={() => {
          goTo('add');
        }}
      />
    </>
  );
}

async function renderAdd() {
  await renderRouter(
    {
      _layout: Layout,
      index: Start,
      add: () => (
        <WorkoutPicksProvider>
          <AddWorkoutExerciseScreen id="w1" />
        </WorkoutPicksProvider>
      ),
    },
    { initialUrl: '/' },
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Go' }));
  await screen.findByRole('header', { name: 'Add exercise' });
}

beforeEach(() => {
  adding = () =>
    Response.json({
      ...workout,
      exercises: [...workout.exercises, inWorkout('lunge', 'Lunge')],
    });
  mockFetch.mockReset();
  mockFetch.mockImplementation(answerWith);
});

const hidden = { includeHiddenElements: true };

test('speaks of the workout, and offers only what is not in it', async () => {
  await renderAdd();

  expect(
    screen.getByText('Pick the exercises to add to this workout.'),
  ).toBeOnTheScreen();
  expect(
    await screen.findByRole('button', { name: 'Lunge' }),
  ).toBeOnTheScreen();
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: 'Squat' })).toBeNull();
  });
});

test('nothing picked says why', async () => {
  await renderAdd();

  await fireEvent.press(
    screen.getAllByRole('button', { name: 'Add exercise' })[0],
  );

  expect(await screen.findByText('Pick an exercise first.')).toBeOnTheScreen();
  expect(mockFetch.mock.calls.some(([sent]) => sent.method === 'POST')).toBe(
    false,
  );
});

test('adds what was picked, in the order picked, and goes back', async () => {
  await renderAdd();

  await fireEvent.press(await screen.findByRole('button', { name: 'Lunge' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Leg press' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Add exercises' }));

  expect(await screen.findByText('Logging screen', hidden)).toBeOnTheScreen();
  await waitFor(() => {
    expect(
      screen.queryByRole('header', { name: 'Add exercise', ...hidden }),
    ).toBeNull();
  });
  const request = mockFetch.mock.calls.find(
    ([sent]) => sent.method === 'POST',
  )?.[0];
  expect(await request?.clone().json()).toEqual({
    exerciseIds: ['lunge', 'press'],
  });
});

test('a failed add says so, and stays with the picks', async () => {
  adding = () => Response.json({ code: 'oops', status: 500 }, { status: 500 });
  await renderAdd();

  await fireEvent.press(await screen.findByRole('button', { name: 'Lunge' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Add exercise' }));

  expect(
    await screen.findByText("Couldn't add the exercises. Try again."),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Lunge', selected: true }),
  ).toBeOnTheScreen();
});

test('a conflict says what stands in the way', async () => {
  adding = () =>
    Response.json(
      {
        code: 'workout.too_many_exercises',
        status: 409,
        detail: 'A workout can have at most 30 exercises.',
      },
      { status: 409 },
    );
  await renderAdd();

  await fireEvent.press(await screen.findByRole('button', { name: 'Lunge' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Add exercise' }));

  expect(
    await screen.findByText('A workout can have at most 30 exercises.'),
  ).toBeOnTheScreen();
});
