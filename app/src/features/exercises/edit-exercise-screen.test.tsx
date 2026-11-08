import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { renderRouter } from 'expo-router/testing-library';

import ExerciseRoute from '@/app/(tabs)/exercises/[id]';
import EditExerciseRoute from '@/app/exercise/[id]/edit';
import { TabBar } from '@/components/tab-bar';
import { NotificationBar } from '@/components/notification-bar';
import { ThemeProvider } from '@/theme/theme-provider';

import { ExercisesScreen } from './exercises-screen';
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

const chest = { id: '0198a000-0000-7000-8000-000000000001', name: 'Chest' };
const back = { id: '0198a000-0000-7000-8000-000000000002', name: 'Back' };
const biceps = { id: '0198a000-0000-7000-8000-000000000003', name: 'Biceps' };
const id = '0198a000-0000-7000-8000-00000000000a';

interface Stored {
  name: string;
  groupId: string;
  alsoWorksGroupIds: string[];
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

/** Answers reads from one stored exercise, and writes with these, or by changing it. */
function answer({
  save,
  remove,
}: {
  save?: () => Response;
  remove?: () => Response;
} = {}) {
  const groups = new Map(
    [chest, back, biceps].map((group) => [group.id, group]),
  );
  const nameOf = (groupId: string) => groups.get(groupId) ?? chest;
  let stored: Stored | null = {
    name: 'Bench press',
    groupId: chest.id,
    alsoWorksGroupIds: [back.id],
  };

  mockFetch.mockImplementation(async (request) => {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/v1/groups') {
      return Response.json([...groups.values()]);
    }
    if (pathname === '/api/v1/users/me') {
      return Response.json({
        email: 'filip@example.com',
        name: 'Filip',
        units: 'metric',
        timeZone: 'Europe/Zagreb',
      });
    }
    if (pathname === '/api/v1/exercises') {
      return Response.json(
        stored === null
          ? []
          : [
              {
                id,
                name: stored.name,
                groupId: stored.groupId,
                groupName: nameOf(stored.groupId).name,
                bestSet: null,
              },
            ],
      );
    }
    if (request.method === 'PUT') {
      const failed = save?.();
      if (failed !== undefined) {
        return failed;
      }
      stored = (await request.json()) as Stored;
      return Response.json({ id, ...stored });
    }
    if (request.method === 'DELETE') {
      const failed = remove?.();
      if (failed !== undefined) {
        return failed;
      }
      stored = null;
      return new Response(null, { status: 204 });
    }
    if (new URL(request.url).pathname.endsWith('/sessions')) {
      return Response.json({ sessions: [], months: [], nextCursor: null });
    }
    if (stored === null) {
      return problem(404, 'exercise.not_found', 'The exercise does not exist.');
    }

    return Response.json({
      id,
      name: stored.name,
      group: nameOf(stored.groupId),
      routines: [],
      alsoWorksGroups: stored.alsoWorksGroupIds.map(nameOf),
      bestSet: null,
      timesDone: 0,
      firstDoneOn: null,
    });
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

/** The sheet opens over the exercise, so its button comes after the one with the same name behind it. */
function pressLast(name: string) {
  const buttons = screen.getAllByRole('button', { name });

  return fireEvent.press(buttons[buttons.length - 1]);
}

/** Opens E11 the way a user does: E01, then a row. */
async function openDetails() {
  await renderRouter(
    {
      _layout: Layout,
      '(tabs)/_layout': () => (
        <Tabs
          tabBar={(props) => <TabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen name="exercises" options={{ title: 'Exercises' }} />
        </Tabs>
      ),
      '(tabs)/exercises/_layout': () => (
        <Stack screenOptions={{ headerShown: false }} />
      ),
      '(tabs)/exercises/index': ExercisesScreen,
      '(tabs)/exercises/[id]': ExerciseRoute,
      'exercise/[id]/edit': EditExerciseRoute,
    },
    { initialUrl: '/exercises' },
  );

  await fireEvent.press(
    await screen.findByRole('button', { name: /Bench press/ }),
  );
  await screen.findByRole('header', { name: 'Bench press' });
}

async function openEdit() {
  await openDetails();
  await fireEvent.press(screen.getByRole('button', { name: 'Edit exercise' }));
  await screen.findByRole('header', { name: 'Edit exercise' });
}

beforeEach(() => {
  mockFetch.mockReset();
});

test('E20 starts with the current values', async () => {
  answer();
  await openEdit();

  expect(screen.getByDisplayValue('Bench press')).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Chest', selected: true }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Back, also works', selected: true }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Biceps, also works', selected: false }),
  ).toBeOnTheScreen();
});

test('a failed save keeps the page and what was typed', async () => {
  answer({ save: () => problem(500, 'server_error', 'Something failed.') });
  await openEdit();

  await fireEvent.changeText(screen.getByDisplayValue('Bench press'), 'Squat');
  await fireEvent.press(screen.getByRole('button', { name: 'Save exercise' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't save the exercise. Try again.",
  );
  expect(screen.getByDisplayValue('Squat')).toBeOnTheScreen();
});

test('saving sends the new values and E11 shows them', async () => {
  answer();
  await openEdit();

  await fireEvent.changeText(
    screen.getByDisplayValue('Bench press'),
    '  Incline press ',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Biceps, also works' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save exercise' }));

  expect(
    await screen.findByRole('header', { name: 'Incline press' }),
  ).toBeOnTheScreen();
  expect(screen.getByText('Chest · back · biceps')).toBeOnTheScreen();
  expect(screen.getByRole('alert')).toHaveTextContent('Incline press saved.');
});

test('a name another exercise has shows under Name, and nothing leaves E20', async () => {
  answer({
    save: () =>
      problem(
        409,
        'exercise.name_taken',
        'You already have an exercise with this name.',
      ),
  });
  await openEdit();

  await fireEvent.press(screen.getByRole('button', { name: 'Save exercise' }));

  expect(
    await screen.findByText('You already have an exercise with this name.'),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('header', { name: 'Edit exercise' }),
  ).toBeOnTheScreen();
});

test('a blank name is stopped before anything is sent', async () => {
  answer();
  await openEdit();

  await fireEvent.changeText(screen.getByDisplayValue('Bench press'), '   ');
  await fireEvent.press(screen.getByRole('button', { name: 'Save exercise' }));

  expect(await screen.findByText('Enter a name.')).toBeOnTheScreen();
  expect(
    mockFetch.mock.calls.some(([request]) => request.method === 'PUT'),
  ).toBe(false);
});

test('with no changes, the back link names the exercise and just returns', async () => {
  answer();
  await openEdit();

  await fireEvent.press(screen.getByRole('link', { name: 'Bench press' }));

  await waitFor(() => {
    expect(screen.queryByRole('header', { name: 'Edit exercise' })).toBeNull();
  });
  expect(screen.getByRole('header', { name: 'Bench press' })).toBeOnTheScreen();
  expect(
    mockFetch.mock.calls.some(([request]) => request.method === 'PUT'),
  ).toBe(false);
});

test('Delete exercise asks first, and says what stays', async () => {
  answer();
  await openDetails();

  await pressLast('Delete exercise');

  expect(
    await screen.findByRole('header', { name: 'Delete Bench press?' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByText(
      "It's removed from your list. Workouts you already logged keep it.",
    ),
  ).toBeOnTheScreen();
  expect(
    mockFetch.mock.calls.some(([request]) => request.method === 'DELETE'),
  ).toBe(false);
});

test('Closing the sheet keeps the exercise', async () => {
  answer();
  await openDetails();

  await pressLast('Delete exercise');
  await screen.findByRole('header', { name: 'Delete Bench press?' });
  await pressLast('Close');

  await waitFor(() => {
    expect(
      screen.queryByRole('header', { name: 'Delete Bench press?' }),
    ).toBeNull();
  });
  expect(screen.getByRole('header', { name: 'Bench press' })).toBeOnTheScreen();
});

test('confirming deletes it and E01 says so', async () => {
  answer();
  await openDetails();

  await pressLast('Delete exercise');
  await screen.findByRole('header', { name: 'Delete Bench press?' });
  await pressLast('Delete exercise');

  expect(await screen.findByText('Bench press deleted.')).toBeOnTheScreen();
  await waitFor(() => {
    expect(screen.queryByRole('header', { name: 'Bench press' })).toBeNull();
  });
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /Bench press/ })).toBeNull();
  });
});

test('a failed delete stays on the sheet and says so', async () => {
  answer({ remove: () => problem(500, 'server_error', 'Something failed.') });
  await openDetails();

  await pressLast('Delete exercise');
  await screen.findByRole('header', { name: 'Delete Bench press?' });
  await pressLast('Delete exercise');

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't delete the exercise. Try again.",
  );
  expect(
    screen.getByRole('header', { name: 'Delete Bench press?' }),
  ).toBeOnTheScreen();
});

test('with changes, leaving asks first, and closing the sheet keeps them', async () => {
  answer();
  await openEdit();
  await fireEvent.changeText(screen.getByDisplayValue('Bench press'), 'Squat');

  await fireEvent.press(screen.getByRole('link', { name: 'Bench press' }));

  expect(
    await screen.findByRole('header', { name: 'Discard changes?' }),
  ).toBeOnTheScreen();

  await pressLast('Close');

  await waitFor(() => {
    expect(
      screen.queryByRole('header', { name: 'Discard changes?' }),
    ).toBeNull();
  });
  expect(screen.getByDisplayValue('Squat')).toBeOnTheScreen();
});

test('picking another group counts as a change, and Discard changes leaves', async () => {
  answer();
  await openEdit();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));

  await fireEvent.press(screen.getByRole('link', { name: 'Bench press' }));
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Discard changes' }),
  );

  await waitFor(() => {
    expect(screen.queryByRole('header', { name: 'Edit exercise' })).toBeNull();
  });
  expect(screen.getByRole('header', { name: 'Bench press' })).toBeOnTheScreen();
  expect(
    mockFetch.mock.calls.some(([request]) => request.method === 'PUT'),
  ).toBe(false);
});

test('a save that failed still asks before leaving', async () => {
  answer({ save: () => problem(500, 'server_error', 'Something failed.') });
  await openEdit();
  await fireEvent.changeText(screen.getByDisplayValue('Bench press'), 'Squat');
  await fireEvent.press(screen.getByRole('button', { name: 'Save exercise' }));
  await screen.findByRole('alert');

  await fireEvent.press(screen.getByRole('link', { name: 'Bench press' }));

  expect(
    await screen.findByRole('header', { name: 'Discard changes?' }),
  ).toBeOnTheScreen();
});
