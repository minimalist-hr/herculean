import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router, Stack, type Href } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import AddExerciseRoute from '@/app/routine/[id]/edit/add-exercise';
import EditRoutineLayout from '@/app/routine/[id]/edit/_layout';
import EditRoutineRoute from '@/app/routine/[id]/edit/index';
import NewExerciseForRoutineRoute from '@/app/routine/[id]/edit/new-exercise';
import TargetsRoute from '@/app/routine/[id]/edit/targets';
import { NotificationBar } from '@/components/notification-bar';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ThemeProvider } from '@/theme/theme-provider';

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

const id = '0198a000-0000-7000-8000-000000000001';

const routine = {
  id,
  name: 'Legs',
  weekdays: ['monday'],
  exercises: [
    {
      exerciseId: 'squat',
      name: 'Squat',
      groupId: 'g',
      groupName: 'Legs',
      targetSets: 3,
      targetRepsFrom: 8,
      targetRepsTo: 10,
    },
    {
      exerciseId: 'lunge',
      name: 'Lunge',
      groupId: 'g',
      groupName: 'Legs',
      targetSets: 2,
      targetRepsFrom: 6,
      targetRepsTo: 6,
    },
  ],
};

interface Saved {
  name: string;
  weekdays: string[];
  exercises: { exerciseId: string; targetSets: number }[];
}

let saved: Saved | undefined;

function answer(save?: () => Response) {
  saved = undefined;
  mockFetch.mockImplementation(async (request) => {
    const { pathname } = new URL(request.url);
    if (request.method === 'PUT') {
      saved = (await request.json()) as Saved;
      return save?.() ?? Response.json({ id, name: saved.name, movedDays: [] });
    }
    if (pathname === '/api/v1/groups') {
      return Response.json([]);
    }
    if (pathname === '/api/v1/exercises') {
      return Response.json([
        {
          id: 'squat',
          name: 'Squat',
          groupId: 'g',
          groupName: 'Legs',
          bestSet: null,
        },
        {
          id: 'press',
          name: 'Press',
          groupId: 'g',
          groupName: 'Legs',
          bestSet: null,
        },
      ]);
    }
    return Response.json(routine);
  });
}

function Layout() {
  return (
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false, gcTime: Infinity },
            mutations: { gcTime: 0 },
          },
        })
      }
    >
      <ThemeProvider theme="dark">
        <Stack screenOptions={{ headerShown: false }} />
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function openEdit() {
  await renderRouter(
    {
      _layout: Layout,
      index: () => <PlaceholderScreen title="Routine screen" />,
      'routine/[id]/edit/_layout': EditRoutineLayout,
      'routine/[id]/edit/index': EditRoutineRoute,
      'routine/[id]/edit/add-exercise': AddExerciseRoute,
      'routine/[id]/edit/new-exercise': NewExerciseForRoutineRoute,
      'routine/[id]/edit/targets': TargetsRoute,
    },
    { initialUrl: '/' },
  );
  await act(async () => {
    await Promise.resolve();
    router.push(`/routine/${id}/edit` as Href);
  });
}

async function loaded() {
  await openEdit();
  await screen.findByDisplayValue('Legs');
}

beforeEach(() => {
  mockFetch.mockReset();
});

test('starts from the routine, with its name on the back link and only Save', async () => {
  answer();
  await loaded();

  expect(
    screen.getByRole('header', { name: 'Edit routine' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByText(
      'Changes apply to new workouts. Logged workouts stay as they are.',
    ),
  ).toBeOnTheScreen();
  expect(screen.getByRole('link', { name: 'Legs' })).toBeOnTheScreen();
  expect(screen.getByText('Squat')).toBeOnTheScreen();
  expect(screen.getByText('2 exercises · 5 sets')).toBeOnTheScreen();
  expect(screen.getAllByText(/· Legs$/)).toHaveLength(2);
  expect(
    screen.getByRole('button', { name: 'Save routine' }),
  ).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Delete routine' })).toBeNull();
});

test('each exercise shows a pencil, because the row opens its sets and reps', async () => {
  answer();
  await openEdit();
  await loaded();

  expect(screen.getAllByTestId('edit-targets').length).toBeGreaterThan(0);
});

test('a failed read says so, and Try again reads it again', async () => {
  mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  await openEdit();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't load this routine.",
  );

  answer();
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByDisplayValue('Legs')).toBeOnTheScreen();
});

test('saving sends the changes, says so and goes back', async () => {
  answer();
  await loaded();

  await fireEvent.changeText(screen.getByLabelText('Name'), 'Lower body');
  await fireEvent.press(screen.getByRole('button', { name: 'Save routine' }));

  expect(await screen.findByText('Lower body saved.')).toBeOnTheScreen();
  expect(await screen.findByText('Routine screen')).toBeOnTheScreen();
  expect(saved?.name).toBe('Lower body');
  expect(saved?.exercises.map((exercise) => exercise.exerciseId)).toEqual([
    'squat',
    'lunge',
  ]);
});

test('days start from the routine, and picking one sends it and says what moved', async () => {
  answer(() =>
    Response.json({
      id,
      name: 'Legs',
      movedDays: [{ weekday: 'thursday', fromRoutine: 'Push' }],
    }),
  );
  await loaded();

  expect(
    screen.getByText('Picking a day replaces its routine'),
  ).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Monday' })).toHaveProp(
    'accessibilityState',
    { selected: true },
  );

  await fireEvent.press(screen.getByRole('button', { name: 'Thursday' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save routine' }));

  expect(
    await screen.findByText('Legs saved. Thursday moved from Push.'),
  ).toBeOnTheScreen();
  expect(saved?.weekdays).toEqual(['monday', 'thursday']);
});

test('a changed day asks before leaving', async () => {
  answer();
  await loaded();

  await fireEvent.press(screen.getByRole('button', { name: 'Monday' }));
  await fireEvent.press(screen.getByRole('link', { name: 'Legs' }));

  expect(await screen.findByText('Discard changes?')).toBeOnTheScreen();
});

test('a taken name shows under Name and stays on the page', async () => {
  const detail = 'You already have a routine with this name.';
  answer(() =>
    Response.json(
      {
        type: 'about:blank',
        title: 'Conflict',
        status: 409,
        detail,
        code: 'routine.name_taken',
        traceId: '00-1',
      },
      { status: 409 },
    ),
  );
  await loaded();

  await fireEvent.changeText(screen.getByLabelText('Name'), 'Arms');
  await fireEvent.press(screen.getByRole('button', { name: 'Save routine' }));

  expect(await screen.findByText(detail)).toBeOnTheScreen();
  expect(
    screen.getByRole('header', { name: 'Edit routine' }),
  ).toBeOnTheScreen();
});

test('removing every exercise is stopped at Save', async () => {
  answer();
  await loaded();

  for (const name of ['Squat', 'Lunge']) {
    await fireEvent.press(
      screen.getByRole('button', { name: `Remove ${name}` }),
    );
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Remove exercise' }),
    );
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: `Remove ${name}` }),
      ).toBeNull();
    });
  }
  await fireEvent.press(screen.getByRole('button', { name: 'Save routine' }));

  expect(
    await screen.findByText('Add at least one exercise.'),
  ).toBeOnTheScreen();
  expect(saved).toBeUndefined();
});

test('the back link leaves without asking when nothing changed', async () => {
  answer();
  await loaded();

  await fireEvent.press(screen.getByRole('link', { name: 'Legs' }));

  expect(await screen.findByText('Routine screen')).toBeOnTheScreen();
  expect(screen.queryByText('Discard changes?')).toBeNull();
});

async function removeSquat() {
  await fireEvent.press(screen.getByRole('button', { name: 'Remove Squat' }));
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Remove exercise' }),
  );
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: 'Remove Squat' })).toBeNull();
  });
}

test('a removed exercise asks before leaving', async () => {
  answer();
  await loaded();

  await removeSquat();
  await fireEvent.press(screen.getByRole('link', { name: 'Legs' }));

  expect(await screen.findByText('Discard changes?')).toBeOnTheScreen();
});

test('after Undo nothing has changed, so leaving does not ask', async () => {
  answer();
  await loaded();

  await removeSquat();
  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));
  await screen.findByRole('button', { name: 'Remove Squat' });
  await fireEvent.press(screen.getByRole('link', { name: 'Legs' }));

  expect(await screen.findByText('Routine screen')).toBeOnTheScreen();
});

test('targets and Add exercise open under the edit page', async () => {
  answer();
  await loaded();

  await fireEvent.press(
    screen.getByRole('button', { name: 'Squat, 3 × 8–10' }),
  );
  expect(
    await screen.findByRole('link', { name: 'Edit routine' }),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('link', { name: 'Edit routine' }));
  await waitFor(() => {
    expect(screen.queryByRole('link', { name: 'Edit routine' })).toBeNull();
  });

  await fireEvent.press(
    screen.getAllByRole('button', { name: 'Add exercise' })[0],
  );

  expect(
    await screen.findByRole('header', { name: 'Add exercise' }),
  ).toBeOnTheScreen();
  expect(await screen.findByText('Press')).toBeOnTheScreen();
  expect(screen.queryByText('Lunge')).toBeNull();
});
