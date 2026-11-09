import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import AddExerciseRoute from '@/app/routine/new/add-exercise';
import NewRoutineLayout from '@/app/routine/new/_layout';
import NewRoutineRoute from '@/app/routine/new/index';
import NewExerciseForRoutineRoute from '@/app/routine/new/new-exercise';
import TargetsRoute from '@/app/routine/new/targets';

import { NotificationBar } from '@/components/notification-bar';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ThemeProvider } from '@/theme/theme-provider';

import { RoutinesScreen } from './routines-screen';
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
const chest = { id: 'chest', name: 'Chest' };

function row(id: string, name: string, group = legs) {
  return {
    id,
    name,
    groupId: group.id,
    groupName: group.name,
    bestSet: null,
  };
}

function problem(status: number, code: string, detail: string) {
  return Response.json(
    {
      type: 'about:blank',
      title: 'Error',
      status,
      detail,
      code,
      traceId: '00-1',
    },
    { status },
  );
}

interface Saved {
  name: string;
  weekdays: string[];
  exercises: { exerciseId: string; targetSets: number }[];
}

let saved: Saved | undefined;

/** Answers reads, and answers saving a routine with this. */
function answer(save?: () => Response, groups: unknown[] = [chest, legs]) {
  saved = undefined;
  let exercises = [row('squat', 'Squat'), row('press', 'Bench press', chest)];

  mockFetch.mockImplementation(async (request) => {
    const url = new URL(request.url);
    if (url.pathname === '/api/v1/groups') {
      return Response.json(groups);
    }
    if (url.pathname === '/api/v1/users/me') {
      return Response.json({
        email: 'filip@example.com',
        name: 'Filip',
        units: 'metric',
        timeZone: 'Europe/Zagreb',
      });
    }
    if (url.pathname === '/api/v1/routines' && request.method === 'GET') {
      return Response.json([]);
    }
    if (url.pathname === '/api/v1/routines' && request.method === 'POST') {
      saved = (await request.json()) as Saved;
      return (
        save?.() ??
        Response.json(
          { id: 'r', name: saved.name.trim(), movedDays: [] },
          { status: 201 },
        )
      );
    }
    if (url.pathname === '/api/v1/exercises' && request.method === 'POST') {
      const { name } = (await request.json()) as { name: string };
      exercises = [...exercises, row('new', name)];
      return Response.json(
        { id: 'new', name, groupId: legs.id, alsoWorksGroupIds: [] },
        { status: 201 },
      );
    }
    if (url.pathname === '/api/v1/exercises') {
      const search = url.searchParams.get('search')?.toLowerCase();
      return Response.json(
        exercises.filter(
          (item) =>
            search === undefined || item.name.toLowerCase().includes(search),
        ),
      );
    }

    return Response.json([]);
  });
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

async function openNew() {
  await renderRouter(
    {
      _layout: Layout,
      index: RoutinesScreen,
      'routines/[id]': () => <PlaceholderScreen title="Routine screen" />,
      'routine/new/_layout': NewRoutineLayout,
      'routine/new/index': NewRoutineRoute,
      'routine/new/add-exercise': AddExerciseRoute,
      'routine/new/new-exercise': NewExerciseForRoutineRoute,
      'routine/new/targets': TargetsRoute,
    },
    { initialUrl: '/' },
  );
  await fireEvent.press(screen.getByRole('button', { name: 'New routine' }));
  await screen.findByRole('header', { name: 'New routine' });
}

/** A page or sheet opens over the screen, so its button comes after any with the same name behind it. */
function pressLast(name: string) {
  const buttons = screen.getAllByRole('button', { name });

  return fireEvent.press(buttons[buttons.length - 1]);
}

async function openAddExercise() {
  await fireEvent.press(
    screen.getAllByRole('button', { name: 'Add exercise' })[0],
  );
  await screen.findByRole('header', { name: 'Add exercise' });
}

async function addExerciseClosed() {
  await waitFor(() => {
    expect(screen.queryByRole('header', { name: 'Add exercise' })).toBeNull();
  });
}

async function editorClosed() {
  await waitFor(() => {
    expect(screen.queryByRole('header', { name: 'New routine' })).toBeNull();
  });
}

async function addSquat() {
  await openAddExercise();
  await fireEvent.press(await screen.findByRole('button', { name: 'Squat' }));
  await pressLast('Add exercise');
  await addExerciseClosed();
  await screen.findByText('Squat');
}

async function save(name = 'Legs') {
  await fireEvent.changeText(screen.getByLabelText('Name'), name);
  await fireEvent.press(screen.getByRole('button', { name: 'Save routine' }));
}

beforeEach(() => {
  mockFetch.mockReset();
});

test('starts empty and says what to do', async () => {
  answer();
  await openNew();

  expect(screen.getByText('Pick its days now or later.')).toBeOnTheScreen();
  expect(screen.getByText('No exercises yet')).toBeOnTheScreen();
});

test('the exercises label always says how many', async () => {
  answer();
  await openNew();

  expect(screen.getByText('0 exercises · 0 sets')).toBeOnTheScreen();
});

test('a routine with no name or exercises is stopped before anything is sent', async () => {
  answer();
  await openNew();

  await fireEvent.press(screen.getByRole('button', { name: 'Save routine' }));

  expect(await screen.findByText('Enter a name.')).toBeOnTheScreen();
  expect(screen.getByText('Add at least one exercise.')).toBeOnTheScreen();
  expect(saved).toBeUndefined();
});

test('picked exercises come back at 3 × 8–10, and saving sends them', async () => {
  answer();
  await openNew();
  await addSquat();

  expect(screen.getByText('3 × 8–10')).toBeOnTheScreen();
  expect(screen.getByText('1 exercise · 3 sets')).toBeOnTheScreen();

  await save('  Legs ');

  expect(await screen.findByRole('alert')).toHaveTextContent('Legs created.');
  await editorClosed();
  expect(saved).toEqual({
    name: 'Legs',
    weekdays: [],
    exercises: [
      {
        exerciseId: 'squat',
        targetSets: 3,
        targetRepsFrom: 8,
        targetRepsTo: 10,
      },
    ],
  });
});

test('the button names how many are picked, and says when none are', async () => {
  answer();
  await openNew();
  await openAddExercise();

  await pressLast('Add exercise');
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Pick an exercise first.',
  );

  await fireEvent.press(await screen.findByRole('button', { name: 'Squat' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Bench press' }));
  expect(
    screen.getByRole('button', { name: 'Add exercises' }),
  ).toBeOnTheScreen();
});

test('an exercise already in the routine is not offered again', async () => {
  answer();
  await openNew();
  await addSquat();

  await openAddExercise();

  expect(
    await screen.findByRole('button', { name: 'Bench press' }),
  ).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Squat' })).toBeNull();
});

test('opening Add exercise again starts with nothing picked', async () => {
  answer();
  await openNew();
  await addSquat();

  await openAddExercise();
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Bench press' }),
  );
  await pressLast('Add exercise');
  await addExerciseClosed();

  expect(await screen.findByText('Bench press')).toBeOnTheScreen();
  expect(screen.getAllByText('Squat')).toHaveLength(1);
});

test('a new exercise from a search comes back selected and new, and its description shows', async () => {
  answer();
  await openNew();
  await openAddExercise();
  await screen.findByRole('button', { name: 'Squat' });

  await fireEvent.changeText(
    screen.getByLabelText('Search exercises'),
    'Hack squat',
  );
  expect(
    await screen.findByText('No matches for “Hack squat”'),
  ).toBeOnTheScreen();

  await pressLast('New exercise');
  await screen.findByRole('header', { name: 'New exercise' });
  expect(
    screen.getByText(
      'It’s added to your exercise list and can be used in any routine or workout.',
    ),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText('Name')).toHaveDisplayValue('Hack squat');
  await pressLast('Legs');
  await fireEvent.press(screen.getByRole('button', { name: 'Save exercise' }));

  expect(await screen.findByText('New')).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Hack squat', selected: true }),
  ).toBeOnTheScreen();
});

test('a failed read on Add exercise says so', async () => {
  answer();
  await openNew();
  mockFetch.mockRejectedValue(new TypeError('Network request failed'));

  await openAddExercise();

  expect(
    await screen.findByText('Couldn’t load your exercises.'),
  ).toBeOnTheScreen();
});

test('leaving Add exercise with picks asks first, and adds nothing', async () => {
  answer();
  await openNew();
  await openAddExercise();
  await fireEvent.press(await screen.findByRole('button', { name: 'Squat' }));

  await fireEvent.press(screen.getByRole('link', { name: 'New routine' }));
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Discard changes' }),
  );

  await addExerciseClosed();
  expect(screen.getByText('No exercises yet')).toBeOnTheScreen();
});

test('targets change on a page, and the low end never passes the high end', async () => {
  answer();
  await openNew();
  await addSquat();

  await fireEvent.press(screen.getByRole('button', { name: /^Squat, 3/ }));
  await screen.findByRole('header', { name: 'Squat' });
  expect(
    screen.getByText(
      'Logging shows this as 3 × 8–10. Use the same number twice for a fixed rep count.',
    ),
  ).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'One set more' }));
  for (let press = 0; press < 3; press += 1) {
    await fireEvent.press(
      screen.getByRole('button', { name: 'One rep more from' }),
    );
  }

  expect(
    screen.getByText(
      'Logging shows this as 4 × 11. Use the same number twice for a fixed rep count.',
    ),
  ).toBeOnTheScreen();

  await pressLast('Save targets');

  expect(await screen.findByText('4 × 11')).toBeOnTheScreen();
});

test('a stepper at its limit says why', async () => {
  answer();
  await openNew();
  await addSquat();
  await fireEvent.press(screen.getByRole('button', { name: /^Squat, 3/ }));
  await screen.findByRole('header', { name: 'Squat' });

  for (let press = 0; press < 2; press += 1) {
    await fireEvent.press(screen.getByRole('button', { name: 'One set less' }));
  }
  await fireEvent.press(
    screen.getByRole('button', {
      name: 'One set less, not available at the limit',
    }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('At least 1 set.');

  for (let press = 0; press < 7; press += 1) {
    await fireEvent.press(
      screen.getByRole('button', { name: 'One rep less from' }),
    );
  }
  await fireEvent.press(
    screen.getByRole('button', {
      name: 'One rep less from, not available at the limit',
    }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('At least 1 rep.');
});

test('removing asks first, and Undo puts it back', async () => {
  answer();
  await openNew();
  await addSquat();

  await fireEvent.press(screen.getByRole('button', { name: 'Remove Squat' }));
  expect(
    await screen.findByRole('header', { name: 'Remove Squat?' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByText(
      'It’s removed from this routine, with its 3 × 8–10 target. Workouts you already logged stay.',
    ),
  ).toBeOnTheScreen();

  await pressLast('Remove exercise');

  expect(await screen.findByText('No exercises yet')).toBeOnTheScreen();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /^Squat removed\./,
  );

  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

  expect(await screen.findByText('Squat')).toBeOnTheScreen();
});

test('moving an exercise changes the order it saves in', async () => {
  answer();
  await openNew();
  await openAddExercise();
  await fireEvent.press(await screen.findByRole('button', { name: 'Squat' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Bench press' }));
  await pressLast('Add exercises');
  await addExerciseClosed();

  await fireEvent(
    await screen.findByRole('button', { name: 'Move Bench press' }),
    'accessibilityAction',
    { nativeEvent: { actionName: 'moveUp' } },
  );
  await save();

  await waitFor(() => {
    expect(saved?.exercises.map((item) => item.exerciseId)).toEqual([
      'press',
      'squat',
    ]);
  });
});

test('picked days are sent in week order, and clearing one takes it back', async () => {
  answer();
  await openNew();
  await addSquat();
  await fireEvent.changeText(screen.getByLabelText('Name'), 'Legs');

  expect(screen.getByText(/· optional/)).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Thursday' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Monday' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Friday' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Friday' }));
  await pressLast('Save routine');

  await editorClosed();
  expect(saved?.weekdays).toEqual(['monday', 'thursday']);
});

test('days taken from different routines are named together', async () => {
  answer(() =>
    Response.json(
      {
        id: 'r',
        name: 'Legs',
        movedDays: [
          { weekday: 'monday', fromRoutine: 'Push' },
          { weekday: 'thursday', fromRoutine: 'Pull' },
        ],
      },
      { status: 201 },
    ),
  );
  await openNew();
  await addSquat();
  await fireEvent.changeText(screen.getByLabelText('Name'), 'Legs');
  await pressLast('Save routine');

  expect(
    await screen.findByText(
      'Legs created. Monday and Thursday moved from other routines.',
    ),
  ).toBeOnTheScreen();
});

test('a name the user already has shows under Name', async () => {
  answer(() =>
    problem(
      409,
      'routine.name_taken',
      'You already have a routine with this name.',
    ),
  );
  await openNew();
  await addSquat();

  await save();

  expect(
    await screen.findByText('You already have a routine with this name.'),
  ).toBeOnTheScreen();
  expect(screen.getByRole('header', { name: 'New routine' })).toBeOnTheScreen();
});

test('the limit shows the API message, and other failures a general one', async () => {
  answer(() =>
    problem(
      409,
      'routine.limit_reached',
      'You’ve reached the limit of 50 routines.',
    ),
  );
  await openNew();
  await addSquat();

  await save();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'You’ve reached the limit of 50 routines.',
  );

  mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  await fireEvent.press(screen.getByRole('button', { name: 'Save routine' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Couldn’t save the routine. Try again.',
  );
});

test('a typed name or an added exercise asks before leaving', async () => {
  answer();
  await openNew();
  await addSquat();

  await fireEvent.press(screen.getByRole('link', { name: 'Routines' }));
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Discard changes' }),
  );

  await editorClosed();
  expect(saved).toBeUndefined();
});

test('changed targets ask before leaving, and unchanged ones do not', async () => {
  answer();
  await openNew();
  await addSquat();
  await fireEvent.press(screen.getByRole('button', { name: /^Squat, 3/ }));
  await screen.findByRole('header', { name: 'Squat' });
  await fireEvent.press(screen.getByRole('button', { name: 'One set more' }));

  await fireEvent.press(screen.getByRole('link', { name: 'New routine' }));

  expect(
    await screen.findByRole('header', { name: 'Discard changes?' }),
  ).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Discard changes' }),
  );
  await screen.findByText('3 × 8–10');

  await fireEvent.press(screen.getByRole('button', { name: /^Squat, 3/ }));
  await screen.findByRole('header', { name: 'Squat' });
  await fireEvent.press(screen.getByRole('link', { name: 'New routine' }));

  await waitFor(() => {
    expect(screen.queryByRole('header', { name: 'Squat' })).toBeNull();
  });
});

test('the back link with nothing entered leaves without asking', async () => {
  answer();
  await openNew();

  await fireEvent.press(screen.getByRole('link', { name: 'Routines' }));

  await editorClosed();
  expect(saved).toBeUndefined();
});

test('with no groups, New exercise on Add exercise is muted and says why', async () => {
  answer(undefined, []);
  await openNew();
  await openAddExercise();
  await screen.findByRole('button', { name: 'Squat' });

  await pressLast('New exercise');

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Create a group first.',
  );
  expect(
    screen.getByRole('header', { name: 'Add exercise' }),
  ).toBeOnTheScreen();
});
