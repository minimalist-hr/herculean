import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { NotificationBar } from '@/components/notification-bar';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ThemeProvider } from '@/theme/theme-provider';

import { ExerciseScreen } from './exercise-screen';

const mockFetch = jest.fn<Promise<Response>, [Request]>();
// Sessions have their own answers, so the other tests needn't know about them.
const mockSessions = jest.fn<Promise<Response>, [Request]>();

jest.mock('@/api/client', () => {
  const createClient =
    jest.requireActual<typeof import('openapi-fetch')>('openapi-fetch').default;
  return {
    api: createClient({
      baseUrl: 'http://api.test',
      fetch: (request: Request) =>
        new URL(request.url).pathname.endsWith('/sessions')
          ? mockSessions(request)
          : mockFetch(request),
    }),
  };
});

const id = '0198a000-0000-7000-8000-000000000001';

function exercise(group: string, alsoWorks: string[] = []) {
  return {
    id,
    name: 'Bench press',
    group: { id: group, name: group },
    alsoWorksGroups: alsoWorks.map((name) => ({ id: name, name })),
    routines: [] as { id: string; name: string }[],
    bestSet: null as { weightKg: number; reps: number; date: string } | null,
    timesDone: 0,
    firstDoneOn: null as string | null,
  };
}

const noSessions = { sessions: [], months: [], nextCursor: null };

/** Answers the exercise with this body, and its sessions page by cursor. */
function answer(
  body: unknown,
  sessions: (cursor: string | null) => Response = () =>
    Response.json(noSessions),
) {
  mockSessions.mockImplementation((request) =>
    Promise.resolve(sessions(new URL(request.url).searchParams.get('cursor'))),
  );
  mockFetch.mockImplementation((request) =>
    Promise.resolve(
      Response.json(
        new URL(request.url).pathname === '/api/v1/groups' ? [] : body,
      ),
    ),
  );
}

const doneExercise = {
  ...exercise('Chest'),
  bestSet: { weightKg: 82.5, reps: 10, date: '2026-10-16' },
  timesDone: 3,
  firstDoneOn: '2026-09-25',
};

function session(date: string, sets: [number, number][]) {
  return {
    workoutId: `workout-${date}`,
    date,
    workoutName: 'Chest and arms 2',
    sets: sets.map(([weightKg, reps]) => ({ weightKg, reps })),
  };
}

/** Scrolls to the end of the screen, which loads the next page of sessions. */
function scrollToTheEnd() {
  return fireEvent.scroll(screen.getByText('All sessions'), {
    nativeEvent: {
      layoutMeasurement: { height: 800 },
      contentOffset: { y: 1200 },
      contentSize: { height: 2000 },
    },
  });
}

function Layout() {
  return (
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false, gcTime: Infinity } },
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

async function renderExercise() {
  await renderRouter(
    {
      _layout: Layout,
      index: () => <PlaceholderScreen title="List screen" />,
      '[id]': () => <ExerciseScreen id={id} />,
      'exercise/[id]/edit': () => (
        <PlaceholderScreen title="Edit exercise page" />
      ),
    },
    { initialUrl: `/${id}` },
  );
}

beforeEach(() => {
  mockFetch.mockReset();
  mockSessions.mockReset();
  mockSessions.mockImplementation(() =>
    Promise.resolve(Response.json(noSessions)),
  );
  // Friday 6 November 2026, so dates in 2026 show no year. Only the date is fixed: timers run as usual.
  jest.useFakeTimers({
    now: new Date(2026, 10, 6, 18),
    doNotFake: [
      'hrtime',
      'nextTick',
      'performance',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  });
});

afterEach(() => {
  jest.useRealTimers();
});

test('shows the skeleton, then the exercise', async () => {
  answer(exercise('Shoulders'));
  await renderExercise();

  expect(screen.getByLabelText('Loading the exercise')).toBeOnTheScreen();

  expect(
    await screen.findByRole('header', { name: 'Bench press' }),
  ).toBeOnTheScreen();
  expect(screen.queryByLabelText('Loading the exercise')).toBeNull();
  expect(mockFetch.mock.calls[0][0].url).toBe(
    `http://api.test/api/v1/exercises/${id}`,
  );
});

test('shows only the group when it works nothing else', async () => {
  answer(exercise('Shoulders'));
  await renderExercise();

  expect(await screen.findByText('Shoulders')).toBeOnTheScreen();
});

test('adds the also works groups in lower case', async () => {
  answer(exercise('Chest', ['Shoulders', 'Triceps']));
  await renderExercise();

  expect(
    await screen.findByText('Chest · shoulders · triceps'),
  ).toBeOnTheScreen();
});

test('never done, every section is in its place and says so', async () => {
  answer(exercise('Shoulders'));
  await renderExercise();

  expect(
    await screen.findByText(
      'Finish a workout with this exercise and its sessions show up here.',
    ),
  ).toBeOnTheScreen();
  expect(screen.getByText('—')).toBeOnTheScreen();
  expect(screen.getByText('Not done yet')).toBeOnTheScreen();
  expect(screen.getByText('0 times')).toBeOnTheScreen();
  expect(screen.getByText('No sessions yet')).toBeOnTheScreen();
  expect(screen.getByText('All sessions')).toBeOnTheScreen();
  expect(screen.getByText('Not in any routine yet')).toBeOnTheScreen();
  expect(
    screen.getByText('Add it when you create or edit a routine.'),
  ).toBeOnTheScreen();
});

test('a done exercise shows its best set and how often it was done', async () => {
  answer({
    ...exercise('Chest'),
    bestSet: { weightKg: 82.5, reps: 10, date: '2023-10-16' },
    timesDone: 11,
    firstDoneOn: '2023-08-07',
  });
  await renderExercise();

  expect(await screen.findByText('82.5 kg × 10')).toBeOnTheScreen();
  expect(screen.getByText('Mon, 16th Oct 2023')).toBeOnTheScreen();
  expect(screen.getByText('11 times')).toBeOnTheScreen();
  expect(screen.getByText('Since 7th Aug 2023')).toBeOnTheScreen();
});

test('a failed read says so, and Try again reads it again', async () => {
  mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  await renderExercise();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't load this exercise.",
  );

  answer(exercise('Shoulders'));
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(
    await screen.findByRole('header', { name: 'Bench press' }),
  ).toBeOnTheScreen();
  expect(screen.queryByRole('alert')).toBeNull();
});

test('the edit button opens the edit page', async () => {
  answer(exercise('Shoulders'));
  await renderExercise();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Edit exercise' }),
  );

  expect(await screen.findByText('Edit exercise page')).toBeOnTheScreen();
});

test('the edit button waits for the exercise', async () => {
  mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  await renderExercise();

  await screen.findByRole('alert');

  expect(screen.queryByRole('button', { name: 'Edit exercise' })).toBeNull();
});

function inRoutines(...names: string[]) {
  return {
    ...exercise('Shoulders'),
    routines: names.map((name) => ({ id: name, name })),
  };
}

test.each([
  [['Legs'], "It's in Legs. Remove it from that routine first."],
  [
    ['Arms', 'Legs'],
    "It's in Arms and Legs. Remove it from those routines first.",
  ],
  [
    ['Arms', 'Back', 'Legs'],
    "It's in Arms, Back and Legs. Remove it from those routines first.",
  ],
  [
    ['Arms', 'Back', 'Chest', 'Legs', 'Push'],
    "It's in 5 routines. Remove it from them first.",
  ],
])(
  'in routines %j, the trash is muted and says why',
  async (names, message) => {
    answer(inRoutines(...names));
    await renderExercise();

    await fireEvent.press(
      await screen.findByRole('button', {
        name: 'Delete exercise, not available while it is in a routine',
      }),
    );

    expect(await screen.findByText(message)).toBeOnTheScreen();
    expect(screen.queryByText('Delete Bench press?')).toBeNull();
    expect(screen.getByText(names[0])).toBeOnTheScreen();
    expect(
      mockFetch.mock.calls.some(([request]) => request.method === 'DELETE'),
    ).toBe(false);
  },
);

test('deleting asks first, goes back, and Undo restores it', async () => {
  const requests: string[] = [];
  mockFetch.mockImplementation((request) => {
    const { pathname } = new URL(request.url);
    requests.push(`${request.method} ${pathname}`);
    if (request.method === 'DELETE') {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    if (request.method === 'POST') {
      return Promise.resolve(
        Response.json({
          id,
          name: 'Bench press',
          groupId: 'Shoulders',
          alsoWorksGroupIds: [],
        }),
      );
    }
    return Promise.resolve(Response.json(exercise('Shoulders')));
  });
  await renderExercise();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Delete exercise' }),
  );
  const buttons = await screen.findAllByRole('button', {
    name: 'Delete exercise',
  });
  await fireEvent.press(buttons[buttons.length - 1]);

  expect(await screen.findByText('Bench press deleted.')).toBeOnTheScreen();
  expect(requests).toContain(`DELETE /api/v1/exercises/${id}`);

  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

  await waitFor(() => {
    expect(requests).toContain(`POST /api/v1/exercises/${id}/restore`);
  });
});

test('a failed delete and a failed Undo say so', async () => {
  let deleted = false;
  mockFetch.mockImplementation((request) => {
    if (request.method === 'DELETE') {
      if (!deleted) {
        deleted = true;
        return Promise.reject(new TypeError('Network request failed'));
      }
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    if (request.method === 'POST') {
      return Promise.resolve(
        Response.json(
          {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
            detail: 'You already have an exercise with this name.',
            code: 'exercise.name_taken',
            traceId: '00-1',
          },
          { status: 409 },
        ),
      );
    }
    return Promise.resolve(Response.json(exercise('Shoulders')));
  });
  await renderExercise();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Delete exercise' }),
  );
  let buttons = await screen.findAllByRole('button', {
    name: 'Delete exercise',
  });
  await fireEvent.press(buttons[buttons.length - 1]);

  expect(
    await screen.findByText("Couldn't delete the exercise. Try again."),
  ).toBeOnTheScreen();

  buttons = screen.getAllByRole('button', { name: 'Delete exercise' });
  await fireEvent.press(buttons[buttons.length - 1]);
  await screen.findByText('Bench press deleted.');
  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

  expect(
    await screen.findByText('You already have an exercise with this name.'),
  ).toBeOnTheScreen();
});

test('the back link is there while it loads', async () => {
  answer(exercise('Shoulders'));
  await renderExercise();

  expect(screen.getByRole('link', { name: 'Exercises' })).toBeOnTheScreen();
  await screen.findByRole('header', { name: 'Bench press' });
});

test('sessions show by month, each with its date, workout and sets', async () => {
  answer(doneExercise, () =>
    Response.json({
      sessions: [
        session('2026-10-16', [
          [80, 10],
          [82.5, 8],
        ]),
        session('2026-09-25', [[77.5, 10]]),
      ],
      months: [
        { month: '2026-10', sessions: 1 },
        { month: '2026-09', sessions: 2 },
      ],
      nextCursor: null,
    }),
  );
  await renderExercise();

  expect(await screen.findByText('80 × 10 · 82.5 × 8')).toBeOnTheScreen();
  expect(
    screen.getByRole('header', { name: 'October · 1 session' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('header', { name: 'September · 2 sessions' }),
  ).toBeOnTheScreen();
  expect(screen.getByText('Fri, 25th Sep')).toBeOnTheScreen();
  expect(screen.getAllByText('Chest and arms 2')).toHaveLength(2);
  expect(screen.getAllByText('kg × reps')).toHaveLength(2);
});

test('scrolling to the end loads the next page', async () => {
  answer(doneExercise, (cursor) =>
    Response.json(
      cursor === null
        ? {
            sessions: [session('2026-10-16', [[80, 10]])],
            months: [{ month: '2026-10', sessions: 1 }],
            nextCursor: '2026-10-16',
          }
        : {
            sessions: [session('2023-09-25', [[75, 10]])],
            months: [{ month: '2023-09', sessions: 1 }],
            nextCursor: null,
          },
    ),
  );
  await renderExercise();
  await screen.findByText('80 × 10');

  await scrollToTheEnd();

  expect(await screen.findByText('75 × 10')).toBeOnTheScreen();
  expect(
    screen.getByRole('header', { name: 'September 2023 · 1 session' }),
  ).toBeOnTheScreen();
});

test('a page that fails says so, and Try again loads it', async () => {
  let failing = true;
  answer(doneExercise, (cursor) => {
    if (cursor === null) {
      return Response.json({
        sessions: [session('2026-10-16', [[80, 10]])],
        months: [{ month: '2026-10', sessions: 1 }],
        nextCursor: '2026-10-16',
      });
    }

    return failing
      ? Response.json({ title: 'Down' }, { status: 503 })
      : Response.json({
          sessions: [session('2026-10-09', [[77.5, 10]])],
          months: [{ month: '2026-10', sessions: 2 }],
          nextCursor: null,
        });
  });
  await renderExercise();
  await screen.findByText('80 × 10');

  await scrollToTheEnd();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't load more sessions.",
  );

  failing = false;
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('77.5 × 10')).toBeOnTheScreen();
  expect(
    screen.getByRole('header', { name: 'October · 2 sessions' }),
  ).toBeOnTheScreen();
});

test('sessions that fail to load say so, and Try again reads them', async () => {
  let failing = true;
  answer(doneExercise, () =>
    failing
      ? Response.json({ title: 'Down' }, { status: 503 })
      : Response.json({
          sessions: [session('2026-10-16', [[80, 10]])],
          months: [{ month: '2026-10', sessions: 1 }],
          nextCursor: null,
        }),
  );
  await renderExercise();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't load the sessions.",
  );
  expect(screen.getByText('82.5 kg × 10')).toBeOnTheScreen();

  failing = false;
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('80 × 10')).toBeOnTheScreen();
});
