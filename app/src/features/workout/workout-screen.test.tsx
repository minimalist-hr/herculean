import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { AccessibilityInfo, AppState } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import { PlaceholderScreen } from '@/test-utils/placeholder-screen';
import { dragBy } from '@/test-utils/drag';
import { ThemeProvider } from '@/theme/theme-provider';

import { Button } from '@/components/button';

import { OpenedPage } from '@/test-utils/opened-page';

import { useOpenDay } from './open-day';
import { WorkoutScreen } from './workout-screen';
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

const legs = {
  id: 'legs',
  name: 'Legs',
  exists: true,
  exercises: [
    {
      exerciseId: 'squat',
      name: 'Barbell squat',
      groupId: 'legs-group',
      groupName: 'Lower body',
      targetSets: 3,
      targetRepsFrom: 8,
      targetRepsTo: 10,
    },
    {
      exerciseId: 'press',
      name: 'Leg press',
      groupId: 'legs-group',
      groupName: 'Lower body',
      targetSets: 2,
      targetRepsFrom: 10,
      targetRepsTo: 12,
    },
  ],
};

const restDay = {
  date: '2026-11-03',
  status: 'rest',
  hasRoutines: true,
  workoutId: null,
  routine: null,
  upNext: { date: '2026-11-04', routineId: 'arms', routineName: 'Arms' },
};

const plannedDay = { ...restDay, status: 'planned', routine: legs };

const week = [
  { date: '2026-11-02', status: 'missed', routineName: 'Arms' },
  { date: '2026-11-03', status: 'planned', routineName: 'Legs' },
];

function answer(day: unknown, days: unknown = week) {
  mockFetch.mockImplementation((request) =>
    Promise.resolve(
      Response.json(
        new URL(request.url).pathname === '/api/v1/days' ? days : day,
      ),
    ),
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

async function renderWorkout() {
  await renderRouter(
    {
      _layout: Layout,
      index: () => <WorkoutScreen />,
      'workout/month': () => <PlaceholderScreen title="Month screen" />,
      'workout/details/[id]': () => (
        <PlaceholderScreen title="Details screen" />
      ),
      'workout/choose/[date]': () => (
        <PlaceholderScreen title="Choose routine screen" />
      ),
      'workout/log/[id]': () => <PlaceholderScreen title="Logging screen" />,
      'workout/edit/[id]': () => <PlaceholderScreen title="Edit screen" />,
      'routine/new': () => <PlaceholderScreen title="New routine screen" />,
    },
    { initialUrl: '/' },
  );
}

beforeEach(() => {
  mockFetch.mockReset();
  // Tuesday 3 November 2026. Only the date is fixed: timers run as usual.
  jest.useFakeTimers({
    now: new Date(2026, 10, 3, 18),
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

test('asks for today and the week it is in', async () => {
  answer(plannedDay);
  await renderWorkout();
  await screen.findByText('Legs');

  const urls = mockFetch.mock.calls.map(([request]) => {
    const url = new URL(request.url);
    return url.pathname + url.search;
  });
  expect(urls).toContain('/api/v1/days/2026-11-03');
  expect(urls).toContain('/api/v1/days?from=2026-11-02&to=2026-11-08');
});

test('shows the date and the week while the day loads', async () => {
  mockFetch.mockImplementation(() => new Promise(() => undefined));
  await renderWorkout();

  expect(screen.getByText('Tue, 3rd November')).toBeOnTheScreen();
  expect(screen.getByLabelText('Monday 2')).toBeOnTheScreen();
  expect(screen.getByLabelText('Tuesday 3, today')).toBeOnTheScreen();
  expect(screen.getByLabelText('Loading this day')).toBeOnTheScreen();
});

test('shows the planned routine with its exercises and targets', async () => {
  answer(plannedDay);
  await renderWorkout();

  expect(await screen.findByText('Planned for Tuesday')).toBeOnTheScreen();
  expect(screen.getAllByText('Legs')).toHaveLength(1);
  expect(screen.getByText('2 exercises · 5 sets')).toBeOnTheScreen();
  expect(screen.getByText('Barbell squat')).toBeOnTheScreen();
  expect(screen.getByText('3 × 8–10')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Start workout' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Other routine' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Skip workout' })).toBeTruthy();
});

test('says what the week strip knows about each day', async () => {
  answer(plannedDay);
  await renderWorkout();

  expect(
    await screen.findByLabelText('Monday 2, Arms, missed'),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText('Tuesday 3, Legs, today')).toBeOnTheScreen();
});

test('a failed week says so under the strip, and the day still shows', async () => {
  mockFetch.mockImplementation((request) =>
    new URL(request.url).pathname === '/api/v1/days'
      ? Promise.reject(new TypeError('Network request failed'))
      : Promise.resolve(Response.json(plannedDay)),
  );
  await renderWorkout();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Couldn’t load the week.',
  );
  expect(screen.getByText('Legs')).toBeOnTheScreen();

  answer(plannedDay);
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(
    await screen.findByLabelText('Monday 2, Arms, missed'),
  ).toBeOnTheScreen();
  expect(screen.queryByText('Couldn’t load the week.')).toBeNull();
});

test('marks days with a workout, and leaves rest days plain', async () => {
  answer(plannedDay, [
    { date: '2026-11-02', status: 'missed', routineName: 'Arms' },
    { date: '2026-11-03', status: 'planned', routineName: 'Legs' },
    { date: '2026-11-04', status: 'planned', routineName: 'Arms' },
    { date: '2026-11-05', status: 'rest', routineName: null },
  ]);
  await renderWorkout();
  await screen.findByLabelText('Monday 2, Arms, missed');

  const expectMarker = (date: string, backgroundColor: string) => {
    expect(screen.getByTestId(`marker-${date}`)).toHaveStyle({
      backgroundColor,
    });
  };
  expectMarker('2026-11-02', '#F87171');
  expectMarker('2026-11-03', '#FFFFFF');
  expectMarker('2026-11-04', '#A9AEB6');
  expectMarker('2026-11-05', 'transparent');
});

test('a rest day shows the routine up next', async () => {
  answer(restDay);
  await renderWorkout();

  expect(await screen.findByText('Rest day')).toBeOnTheScreen();
  expect(screen.getAllByText('Today')).toHaveLength(2);
  expect(screen.getByText('Up next')).toBeOnTheScreen();
  expect(screen.getByText('Arms')).toBeOnTheScreen();
  expect(screen.getByText('Tomorrow')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Skip workout' })).toBeNull();
});

test('a rest day before another one says Rest up next', async () => {
  answer({ ...restDay, upNext: { date: '2026-11-04', routineName: null } });
  await renderWorkout();

  expect(await screen.findByText('Rest')).toBeOnTheScreen();
  expect(screen.getByText('Tomorrow')).toBeOnTheScreen();
});

test('with no routines, offers to create one', async () => {
  answer({ ...restDay, hasRoutines: false });
  await renderWorkout();

  expect(await screen.findByText('No routines yet')).toBeOnTheScreen();
  expect(
    screen.getByText('Create a routine and pick the days you train.'),
  ).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'New routine' }));

  expect(await screen.findByText('New routine screen')).toBeOnTheScreen();
});

test('with no routines, an empty workout can start after asking', async () => {
  answer({ ...restDay, hasRoutines: false });
  await renderWorkout();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Start empty workout' }),
  );

  expect(await screen.findByText('Start an empty workout?')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Start workout' })).toBeTruthy();
});

test('says the week and the day could not load, and tries again', async () => {
  mockFetch.mockRejectedValue(new TypeError('Network request failed'));
  await renderWorkout();

  expect(await screen.findByText('Couldn’t load this day.')).toBeOnTheScreen();
  expect(await screen.findByText('Couldn’t load the week.')).toBeOnTheScreen();
  expect(screen.getByLabelText('Monday 2')).toBeOnTheScreen();

  answer(plannedDay);
  // The day's Try again reads the week again too.
  await fireEvent.press(screen.getAllByRole('link', { name: 'Try again' })[1]);

  expect(await screen.findByText('Legs')).toBeOnTheScreen();
  expect(
    await screen.findByLabelText('Monday 2, Arms, missed'),
  ).toBeOnTheScreen();
});

function answerStart(status: number, body: unknown) {
  mockFetch.mockImplementation((request) =>
    Promise.resolve(
      request.method === 'POST'
        ? Response.json(body, { status })
        : Response.json(
            new URL(request.url).pathname === '/api/v1/days'
              ? week
              : plannedDay,
          ),
    ),
  );
}

test('Start workout starts it and opens logging', async () => {
  answerStart(201, { id: 'w1' });
  await renderWorkout();
  await screen.findByText('Legs');

  await fireEvent.press(screen.getByRole('button', { name: 'Start workout' }));

  expect(await screen.findByText('Logging screen')).toBeOnTheScreen();
  const request = mockFetch.mock.calls.find(
    ([sent]) => sent.method === 'POST',
  )?.[0];
  expect(await request?.clone().json()).toEqual({
    date: '2026-11-03',
    status: 'inProgress',
    empty: false,
  });
});

test('Start workout says what stands in its way', async () => {
  answerStart(409, {
    code: 'workout.another_in_progress',
    status: 409,
    detail: 'Resume or finish your workout first.',
  });
  await renderWorkout();
  await screen.findByText('Legs');

  await fireEvent.press(screen.getByRole('button', { name: 'Start workout' }));

  expect(
    await screen.findByText('Resume or finish your workout first.'),
  ).toBeOnTheScreen();
});

test('a failed Start workout says so', async () => {
  answerStart(500, { code: 'oops', status: 500 });
  await renderWorkout();
  await screen.findByText('Legs');

  await fireEvent.press(screen.getByRole('button', { name: 'Start workout' }));

  expect(
    await screen.findByText('Couldn’t start the workout. Try again.'),
  ).toBeOnTheScreen();
});

test('while another workout runs, Start workout and Other routine look muted and say to resume it first', async () => {
  mockFetch.mockImplementation((request) => {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/v1/workouts') {
      return Promise.resolve(
        Response.json([
          { id: 'w9', date: '2026-11-02', status: 'inProgress', name: 'Arms' },
        ]),
      );
    }
    return Promise.resolve(
      Response.json(pathname === '/api/v1/days' ? week : plannedDay),
    );
  });
  await renderWorkout();
  await screen.findByText('Legs');
  const start = screen.getByRole('button', { name: 'Start workout' });
  const other = screen.getByRole('button', { name: 'Other routine' });
  await waitFor(() => {
    expect(start).not.toHaveStyle({ opacity: 1 });
  });
  expect(other).not.toHaveStyle({ opacity: 1 });

  await fireEvent.press(start);

  expect(
    await screen.findByText('Resume or finish your workout first.'),
  ).toBeOnTheScreen();

  await fireEvent.press(other);

  expect(screen.queryByText('Choose routine screen')).toBeNull();
  expect(mockFetch.mock.calls.some(([sent]) => sent.method === 'POST')).toBe(
    false,
  );
});

describe('a day in progress', () => {
  const inProgressDay = {
    ...plannedDay,
    status: 'inProgress',
    workoutId: 'w1',
  };

  function workoutOf(startedAtUtc: string | null) {
    return {
      id: 'w1',
      date: '2026-11-03',
      status: 'inProgress',
      name: 'Legs',
      startedAtUtc,
      exercises: [
        {
          ...legs.exercises[0],
          id: 'squat-in-workout',
          lastTime: null,
          sets: [
            { id: 's1', order: 0, weightKg: 80, reps: 8, checked: true },
            { id: 's2', order: 1, weightKg: 80, reps: 8, checked: false },
          ],
        },
      ],
    };
  }

  function answerInProgress(startedAtUtc: string | null) {
    mockFetch.mockImplementation((request) => {
      const { pathname } = new URL(request.url);
      if (pathname === '/api/v1/workouts/w1') {
        return Promise.resolve(Response.json(workoutOf(startedAtUtc)));
      }

      return Promise.resolve(
        Response.json(pathname === '/api/v1/days' ? week : inProgressDay),
      );
    });
  }

  test('shows the progress and only Resume workout', async () => {
    answerInProgress(null);
    await renderWorkout();

    expect(await screen.findByText('1 of 2 sets')).toBeOnTheScreen();
    expect(screen.getByText('In progress')).toBeOnTheScreen();
    expect(screen.getByText('1/2')).toBeOnTheScreen();
    expect(screen.getByText('Up next')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Start workout' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Skip workout' })).toBeNull();
  });

  test('an empty workout shows its name, not a link to a routine', async () => {
    mockFetch.mockImplementation((request) => {
      const { pathname } = new URL(request.url);
      if (pathname === '/api/v1/workouts/w1') {
        return Promise.resolve(
          Response.json({ ...workoutOf(null), name: 'Workout' }),
        );
      }

      return Promise.resolve(
        Response.json(
          pathname === '/api/v1/days'
            ? week
            : {
                ...inProgressDay,
                routine: { ...legs, id: null, name: 'Workout', exists: false },
              },
        ),
      );
    });
    await renderWorkout();

    expect(await screen.findByText('In progress')).toBeOnTheScreen();
    expect(screen.getByText('Workout')).toBeOnTheScreen();
    expect(screen.queryByRole('link', { name: 'Workout' })).toBeNull();
  });

  test('shows the running time when it has one', async () => {
    answerInProgress(new Date(Date.now() - 400_000).toISOString());
    await renderWorkout();

    expect(await screen.findByText('1 of 2 sets · 6:40')).toBeOnTheScreen();
  });

  test('Resume workout opens logging', async () => {
    answerInProgress(null);
    await renderWorkout();

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Resume workout' }),
    );

    expect(await screen.findByText('Logging screen')).toBeOnTheScreen();
  });
});

describe('a saved day', () => {
  const savedDay = {
    ...plannedDay,
    status: 'completed',
    workoutId: 'w1',
    upNext: { date: '2026-11-04', routineName: 'Arms' },
  };
  const savedWorkout = {
    exercises: [
      {
        id: 'we1',
        exerciseId: 'squat',
        name: 'Barbell squat',
        groupId: 'legs-group',
        groupName: 'Legs',
        targetSets: 3,
        targetRepsFrom: 8,
        targetRepsTo: 10,
        sets: [
          { id: 's1', weightKg: 100, reps: 5 },
          { id: 's2', weightKg: 100, reps: 5 },
        ],
        lastTime: null,
      },
    ],
  };
  const savedSummary = {
    name: 'Legs',
    date: '2026-11-03',
    durationSeconds: 3840,
    setsChecked: 2,
    setsTotal: 2,
    volumeKg: 1000,
    uncheckedExercises: [],
    records: [],
  };

  function answerSaved({
    day = savedDay,
    summary = savedSummary,
    failing = false,
  }: {
    day?: unknown;
    summary?: unknown;
    failing?: boolean;
  } = {}) {
    mockFetch.mockImplementation((request) => {
      const { pathname } = new URL(request.url);
      if (pathname.startsWith('/api/v1/workouts/')) {
        if (failing) {
          return Promise.resolve(new Response(null, { status: 500 }));
        }
        return Promise.resolve(
          Response.json(pathname.endsWith('/summary') ? summary : savedWorkout),
        );
      }
      return Promise.resolve(
        Response.json(pathname === '/api/v1/days' ? week : day),
      );
    });
  }

  test('says it is done, with the sets actually done', async () => {
    answerSaved();
    await renderWorkout();

    expect(await screen.findByText('Done')).toBeOnTheScreen();
    expect(
      await screen.findByText('2 exercises · 2 sets · 64 min'),
    ).toBeOnTheScreen();
    expect(await screen.findByText('2 sets · 1,000 kg')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Undo skip' })).toBeNull();
  });

  test('a past day logged later has no time', async () => {
    answerSaved({ summary: { ...savedSummary, durationSeconds: null } });
    await renderWorkout();

    expect(await screen.findByText('2 exercises · 2 sets')).toBeOnTheScreen();
  });

  test('today shows what is up next', async () => {
    answerSaved();
    await renderWorkout();

    expect(await screen.findByText('Up next')).toBeOnTheScreen();
    expect(screen.getByText('Arms')).toBeOnTheScreen();
  });

  test('a day before today has no up next', async () => {
    answerSaved({ day: { ...savedDay, date: '2026-11-02' } });
    jest.setSystemTime(new Date(2026, 10, 3, 18));
    await renderWorkout();
    await fireEvent.press(
      await screen.findByLabelText('Monday 2, Arms, missed'),
    );

    expect(await screen.findByText('View workout')).toBeOnTheScreen();
    expect(screen.queryByText('Up next')).toBeNull();
  });

  test('View workout opens the details', async () => {
    answerSaved();
    await renderWorkout();

    await fireEvent.press(
      await screen.findByRole('button', { name: 'View workout' }),
    );

    expect(await screen.findByText('Details screen')).toBeOnTheScreen();
  });

  test('Edit opens the edit page', async () => {
    answerSaved();
    await renderWorkout();

    await fireEvent.press(await screen.findByRole('button', { name: 'Edit' }));

    expect(await screen.findByText('Edit screen')).toBeOnTheScreen();
  });

  /** A saved day whose workout can be deleted and restored, like the server. */
  function answerDeletable({ deleteStatus = 204 } = {}) {
    let deleted = false;
    mockFetch.mockImplementation((request) => {
      const { pathname } = new URL(request.url);
      if (request.method === 'DELETE') {
        deleted = deleteStatus === 204;
        return Promise.resolve(new Response(null, { status: deleteStatus }));
      }
      if (request.method === 'POST' && pathname.endsWith('/restore')) {
        deleted = false;
        return Promise.resolve(
          Response.json({ id: 'w1', status: 'completed' }),
        );
      }
      if (pathname.startsWith('/api/v1/workouts/')) {
        return Promise.resolve(
          Response.json(
            pathname.endsWith('/summary') ? savedSummary : savedWorkout,
          ),
        );
      }
      return Promise.resolve(
        Response.json(
          pathname === '/api/v1/days' ? week : deleted ? plannedDay : savedDay,
        ),
      );
    });
  }

  test('Delete asks first, then the day shows its plan, with Undo', async () => {
    answerDeletable();
    await renderWorkout();

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Delete' }),
    );
    expect(
      await screen.findByText(
        'Its sets come out of your history, best sets and month totals. You can undo this right after.',
      ),
    ).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Delete workout' }),
    );

    expect(await screen.findByText('Legs deleted.')).toBeOnTheScreen();
    expect(
      await screen.findByRole('button', { name: 'Start workout' }),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

    expect(await screen.findByText('Done')).toBeOnTheScreen();
  });

  test('a failed delete says so and keeps the workout', async () => {
    answerDeletable({ deleteStatus: 500 });
    await renderWorkout();

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Delete' }),
    );
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Delete workout' }),
    );

    expect(
      await screen.findByText('Couldn’t delete the workout. Try again.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Done')).toBeOnTheScreen();
  });

  test('details that fail to load can be tried again, and the actions stay', async () => {
    answerSaved({ failing: true });
    await renderWorkout();

    expect(
      await screen.findByText('Couldn’t load this workout.'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'View workout' })).toBeTruthy();

    answerSaved();
    await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

    expect(await screen.findByText('2 sets · 1,000 kg')).toBeOnTheScreen();
  });
});

test('Other routine opens the list for that day', async () => {
  answer(plannedDay);
  await renderWorkout();
  await screen.findByText('Legs');

  await fireEvent.press(screen.getByRole('button', { name: 'Other routine' }));

  expect(await screen.findByText('Choose routine screen')).toBeOnTheScreen();
});

test('Other routine before the first day looks muted and says why', async () => {
  mockFetch.mockImplementation((request) => {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/v1/days/first') {
      return Promise.resolve(Response.json({ date: '2026-11-04' }));
    }
    return Promise.resolve(
      Response.json(pathname === '/api/v1/days' ? week : restDay),
    );
  });
  await renderWorkout();
  await screen.findByText('Rest day');
  const other = screen.getByRole('button', { name: 'Other routine' });
  await waitFor(() => {
    expect(other).not.toHaveStyle({ opacity: 1 });
  });

  await fireEvent.press(other);

  expect(
    await screen.findByText('A workout can’t be added before your first day.'),
  ).toBeOnTheScreen();
  expect(screen.queryByText('Choose routine screen')).toBeNull();
});

test('the calendar opens the month', async () => {
  answer(plannedDay);
  await renderWorkout();
  await screen.findByText('Legs');

  await fireEvent.press(screen.getByRole('button', { name: 'Month' }));

  expect(await screen.findByText('Month screen')).toBeOnTheScreen();
});

describe('other days', () => {
  const missedDay = {
    ...plannedDay,
    date: '2026-11-02',
    status: 'missed',
    upNext: { date: '2026-11-03', routineName: 'Legs' },
  };
  const upcomingDay = {
    ...plannedDay,
    date: '2026-11-04',
    upNext: { date: '2026-11-05', routineName: null },
  };
  const laterRestDay = {
    ...restDay,
    date: '2026-11-05',
    upNext: { date: '2026-11-06', routineName: 'Arms' },
  };
  const yesterdayRestDay = {
    ...restDay,
    date: '2026-11-02',
    upNext: { date: '2026-11-03', routineName: 'Legs' },
  };
  const fullWeek = [
    { date: '2026-11-02', status: 'missed', routineName: 'Arms' },
    { date: '2026-11-03', status: 'planned', routineName: 'Legs' },
    { date: '2026-11-04', status: 'planned', routineName: 'Arms' },
    { date: '2026-11-05', status: 'rest', routineName: null },
  ];

  function answerByDate(byDate: Record<string, unknown>) {
    mockFetch.mockImplementation((request) => {
      const { pathname } = new URL(request.url);
      return Promise.resolve(
        Response.json(
          pathname === '/api/v1/days'
            ? fullWeek
            : byDate[pathname.split('/').at(-1) ?? ''],
        ),
      );
    });
  }

  async function open(label: string) {
    await fireEvent.press(await screen.findByRole('button', { name: label }));
  }

  test('a missed day says so, and offers to log or skip it', async () => {
    answerByDate({ '2026-11-03': restDay, '2026-11-02': missedDay });
    await renderWorkout();
    await open('Monday 2, Arms, missed');

    expect(await screen.findByText('Missed')).toBeOnTheScreen();
    expect(screen.getByText('Yesterday')).toBeOnTheScreen();
    expect(screen.getByText('Mon, 2nd November')).toBeOnTheScreen();
    expect(
      screen.getByText('Planned, but nothing was logged.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Barbell squat')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Start workout' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Month' })).toBeNull();

    expect(screen.getByRole('button', { name: 'Log workout' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Skip workout' })).toBeTruthy();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Other routine' }),
    );
    expect(await screen.findByText('Choose routine screen')).toBeOnTheScreen();
  });

  test('tomorrow shows the plan, with its actions muted until the day', async () => {
    answerByDate({ '2026-11-03': restDay, '2026-11-04': upcomingDay });
    await renderWorkout();
    await open('Wednesday 4, Arms');

    expect(await screen.findByText('Planned for Wednesday')).toBeOnTheScreen();
    expect(screen.getByText('Tomorrow')).toBeOnTheScreen();
    expect(screen.getByText('Wed, 4th November')).toBeOnTheScreen();
    expect(screen.getByText('Barbell squat')).toBeOnTheScreen();
    const start = screen.getByRole('button', { name: 'Start workout' });
    const skip = screen.getByRole('button', { name: 'Skip workout' });
    expect(start).not.toHaveStyle({ opacity: 1 });
    expect(skip).not.toHaveStyle({ opacity: 1 });
    expect(
      screen.getByRole('button', { name: 'Other routine' }),
    ).not.toHaveStyle({ opacity: 1 });

    await fireEvent.press(start);

    expect(
      await screen.findByText('A workout can’t be started before its day.'),
    ).toBeOnTheScreen();

    await fireEvent.press(skip);

    expect(
      await screen.findByText('A workout can’t be skipped before its day.'),
    ).toBeOnTheScreen();
    expect(mockFetch.mock.calls.some(([sent]) => sent.method === 'POST')).toBe(
      false,
    );
  });

  test('a later rest day has its weekday as the title, and the next date', async () => {
    answerByDate({ '2026-11-03': restDay, '2026-11-05': laterRestDay });
    await renderWorkout();
    await open('Thursday 5, rest day');

    expect(await screen.findByText('Rest day')).toBeOnTheScreen();
    expect(screen.getAllByText('Thursday')).toHaveLength(2);
    expect(screen.getByText('5th November')).toBeOnTheScreen();
    expect(screen.getByText('Arms')).toBeOnTheScreen();
    expect(screen.getByText('Fri, 6th Nov')).toBeOnTheScreen();
    const other = screen.getByRole('button', { name: 'Other routine' });
    expect(other).not.toHaveStyle({ opacity: 1 });

    await fireEvent.press(other);

    expect(
      await screen.findByText('A workout can’t be started before its day.'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Choose routine screen')).toBeNull();
  });

  test('yesterday as a rest day has no up next', async () => {
    answerByDate({ '2026-11-03': restDay, '2026-11-02': yesterdayRestDay });
    await renderWorkout();
    await open('Monday 2, Arms, missed');

    expect(await screen.findByText('Rest day')).toBeOnTheScreen();
    expect(screen.getByText('Yesterday')).toBeOnTheScreen();
    expect(screen.queryByText('Up next')).toBeNull();
    expect(screen.getByRole('button', { name: 'Other routine' })).toBeTruthy();
  });

  test('an older rest day has no up next', async () => {
    // Friday 6 November, so Monday is no longer yesterday.
    jest.setSystemTime(new Date(2026, 10, 6, 18));
    answerByDate({
      '2026-11-06': { ...restDay, date: '2026-11-06' },
      '2026-11-02': yesterdayRestDay,
    });
    await renderWorkout();
    await open('Monday 2, Arms, missed');

    expect(await screen.findByText('2nd November')).toBeOnTheScreen();
    expect(await screen.findByText('Rest day')).toBeOnTheScreen();
    expect(screen.queryByText('Up next')).toBeNull();
    expect(screen.getByRole('button', { name: 'Other routine' })).toBeTruthy();
  });

  test('Back to today returns to today', async () => {
    answerByDate({ '2026-11-03': plannedDay, '2026-11-04': upcomingDay });
    await renderWorkout();
    await open('Wednesday 4, Arms');
    await screen.findByText('Planned for Wednesday');

    await fireEvent.press(
      screen.getByRole('button', { name: 'Back to today' }),
    );

    expect(await screen.findByText('Planned for Tuesday')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Month' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Back to today' })).toBeNull();
  });

  test('tapping today from today changes nothing', async () => {
    answerByDate({ '2026-11-03': plannedDay });
    await renderWorkout();
    await open('Tuesday 3, Legs, today');

    expect(await screen.findByText('Planned for Tuesday')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Month' })).toBeTruthy();
  });

  test('the selected day has a white marker, and today keeps its own', async () => {
    answerByDate({ '2026-11-03': restDay, '2026-11-02': missedDay });
    await renderWorkout();
    await open('Monday 2, Arms, missed');
    await screen.findByText('Missed');

    expect(screen.getByTestId('marker-2026-11-02')).toHaveStyle({
      backgroundColor: '#FFFFFF',
    });
    expect(screen.getByTestId('marker-2026-11-03')).toHaveStyle({
      backgroundColor: '#A9AEB6',
    });
  });
});

describe('skip', () => {
  const skipped = (day: object) => ({
    ...day,
    status: 'skipped',
    workoutId: 'workout-1',
  });
  const missedDay = {
    ...plannedDay,
    date: '2026-11-02',
    status: 'missed',
    upNext: { date: '2026-11-03', routineName: 'Arms' },
  };

  /** Answers like the API: a skip changes the day, and an undo changes it back. */
  function server(today: object, past: object = missedDay) {
    const skippedDates = new Set<string>();
    const requests: { method: string; path: string; body: unknown }[] = [];

    mockFetch.mockImplementation(async (request) => {
      const { pathname } = new URL(request.url);
      const body: unknown =
        request.method === 'POST' ? await request.clone().json() : undefined;
      if (request.method !== 'GET') {
        requests.push({ method: request.method, path: pathname, body });
      }
      if (request.method === 'POST') {
        skippedDates.add((body as { date: string }).date);
        return Response.json(
          { id: 'workout-1', status: 'skipped', name: 'Legs' },
          { status: 201 },
        );
      }
      if (request.method === 'DELETE') {
        skippedDates.clear();
        return new Response(null, { status: 204 });
      }
      if (pathname === '/api/v1/days') {
        return Response.json(
          ['2026-11-02', '2026-11-03'].map((date) => ({
            date,
            status: skippedDates.has(date) ? 'skipped' : 'planned',
            routineName: 'Legs',
          })),
        );
      }

      const date = pathname.split('/').at(-1) ?? '';
      const day = date === '2026-11-03' ? today : past;
      return Response.json(skippedDates.has(date) ? skipped(day) : day);
    });

    return requests;
  }

  async function press(name: string) {
    await fireEvent.press(await screen.findByRole('button', { name }));
  }

  /** Presses a button on the card, then the same one in the sheet it opens. */
  async function confirm(name: string) {
    await press(name);
    const buttons = await screen.findAllByRole('button', { name });
    await fireEvent.press(buttons[buttons.length - 1]);
  }

  test('skipping asks first, and closing the sheet changes nothing', async () => {
    const requests = server(plannedDay);
    await renderWorkout();
    await press('Skip workout');

    expect(await screen.findByText('Skip Legs?')).toBeOnTheScreen();
    expect(
      screen.getByText('It shows as skipped, and you can undo it.'),
    ).toBeOnTheScreen();
    expect(requests).toEqual([]);

    await press('Close');

    expect(screen.getByRole('button', { name: 'Start workout' })).toBeTruthy();
    expect(requests).toEqual([]);
  });

  test('undoing today asks first, and says it goes back to the plan', async () => {
    const requests = server(plannedDay);
    await renderWorkout();
    await confirm('Skip workout');
    await press('Undo skip');

    expect(await screen.findByText('Undo this skip?')).toBeOnTheScreen();
    expect(
      screen.getByText('This day goes back to its plan.'),
    ).toBeOnTheScreen();
    expect(requests).toHaveLength(1);
  });

  test('undoing a past day asks first, and says it goes back to missed', async () => {
    server(restDay);
    await renderWorkout();
    await press('Monday 2, Legs');
    await confirm('Skip workout');
    await press('Undo skip');

    expect(await screen.findByText('Undo this skip?')).toBeOnTheScreen();
    expect(
      screen.getByText('This day goes back to its plan.'),
    ).toBeOnTheScreen();
  });

  test('skipping today shows it as skipped, with its exercises and Up next', async () => {
    const requests = server(plannedDay);
    await renderWorkout();
    await confirm('Skip workout');

    expect(await screen.findByText('Skipped')).toBeOnTheScreen();
    expect(requests).toEqual([
      {
        method: 'POST',
        path: '/api/v1/workouts',
        body: { date: '2026-11-03', status: 'skipped', empty: false },
      },
    ]);
    expect(screen.getByText('You skipped today’s workout.')).toBeOnTheScreen();
    expect(screen.getByText('Barbell squat')).toBeOnTheScreen();
    expect(screen.getByText('Up next')).toBeOnTheScreen();
    expect(screen.getByText('Tomorrow')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Undo skip' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start workout' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Log workout' })).toBeNull();
  });

  test('undoing a skip today brings Start workout back', async () => {
    const requests = server(plannedDay);
    await renderWorkout();
    await confirm('Skip workout');
    await confirm('Undo skip');

    expect(
      await screen.findByRole('button', { name: 'Start workout' }),
    ).toBeTruthy();
    expect(requests[1]).toEqual({
      method: 'DELETE',
      path: '/api/v1/workouts/workout-1',
      body: undefined,
    });
  });

  test('skipping a missed day offers only Undo skip, with no Up next', async () => {
    server(restDay);
    await renderWorkout();
    await press('Monday 2, Legs');
    await confirm('Skip workout');

    expect(await screen.findByText('Skipped')).toBeOnTheScreen();
    expect(screen.getByText('You skipped this workout.')).toBeOnTheScreen();
    expect(screen.getByText('Barbell squat')).toBeOnTheScreen();
    expect(screen.queryByText('Up next')).toBeNull();
    expect(screen.getByRole('button', { name: 'Undo skip' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Log workout' })).toBeNull();
  });

  test('undoing a skip on a past day shows it as missed', async () => {
    server(restDay);
    await renderWorkout();
    await press('Monday 2, Legs');
    await confirm('Skip workout');
    await confirm('Undo skip');

    expect(await screen.findByText('Missed')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Skip workout' })).toBeTruthy();
  });

  test('the week strip marks a skipped day', async () => {
    server(plannedDay);
    await renderWorkout();
    await press('Monday 2, Legs');
    await confirm('Skip workout');
    await screen.findByText('Skipped');
    await press('Back to today');

    const monday = await screen.findByRole('button', {
      name: 'Monday 2, Legs, skipped',
    });
    expect(monday).toBeTruthy();
    expect(screen.getByTestId('marker-2026-11-02')).toHaveStyle({
      backgroundColor: '#FB923C',
    });
  });

  test('a skip that fails says so, and the day stays', async () => {
    answer(plannedDay);
    const answers = mockFetch.getMockImplementation();
    mockFetch.mockImplementation((request) =>
      request.method === 'POST'
        ? Promise.reject(new TypeError('Network request failed'))
        : (answers as (request: Request) => Promise<Response>)(request),
    );
    await renderWorkout();
    await confirm('Skip workout');

    expect(
      await screen.findByText('Couldn’t skip the workout. Try again.'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Start workout' })).toBeTruthy();
  });

  test('an undo that fails says so, and the day stays skipped', async () => {
    answer(skipped(plannedDay));
    const answers = mockFetch.getMockImplementation();
    mockFetch.mockImplementation((request) =>
      request.method === 'DELETE'
        ? Promise.reject(new TypeError('Network request failed'))
        : (answers as (request: Request) => Promise<Response>)(request),
    );
    await renderWorkout();
    await confirm('Undo skip');

    expect(
      await screen.findByText('Couldn’t undo. Try again.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Skipped')).toBeOnTheScreen();
  });
});

describe('other weeks', () => {
  /** Answers every day as a rest day, with the first day given. */
  function answerWeeks(first: string) {
    mockFetch.mockImplementation((request) => {
      const { pathname } = new URL(request.url);
      if (pathname === '/api/v1/days') {
        return Promise.resolve(Response.json([]));
      }
      if (pathname === '/api/v1/days/first') {
        return Promise.resolve(Response.json({ date: first }));
      }

      return Promise.resolve(
        Response.json({ ...restDay, date: pathname.split('/').at(-1) }),
      );
    });
  }

  function requestedDays() {
    return mockFetch.mock.calls.map(
      ([request]) => new URL(request.url).pathname,
    );
  }

  const strip = () => screen.getByTestId('week-strip');

  async function swipe(distance: number) {
    await dragBy(strip(), distance, 4, 'x');
  }

  // The clock is fixed, so a slide with a duration would never finish.
  beforeEach(() => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('swiping left opens the same weekday next week', async () => {
    answerWeeks('2026-01-01');
    await renderWorkout();
    await screen.findByText('Rest day');

    await swipe(-200);

    expect(await screen.findByText('10th November')).toBeOnTheScreen();
    expect(screen.getByText('Tuesday')).toBeOnTheScreen();
    expect(requestedDays()).toContain('/api/v1/days/2026-11-10');
    expect(screen.getByRole('button', { name: 'Back to today' })).toBeTruthy();
  });

  test('swiping right opens the same weekday last week', async () => {
    answerWeeks('2026-01-01');
    await renderWorkout();
    await screen.findByText('Rest day');
    await screen.findByLabelText(/^Monday 26/, { includeHiddenElements: true });

    await swipe(200);

    expect(await screen.findByText('27th October')).toBeOnTheScreen();
    expect(requestedDays()).toContain('/api/v1/days/2026-10-27');
  });

  test('chevrons beside the strip show the weeks that can be reached', async () => {
    answerWeeks('2026-01-01');
    await renderWorkout();
    await screen.findByLabelText(/^Monday 26/, { includeHiddenElements: true });
    const hint = (id: string) =>
      screen.queryByTestId(id, { includeHiddenElements: true });

    expect(hint('week-strip-back-hint')).toBeOnTheScreen();
    expect(hint('week-strip-forward-hint')).toBeOnTheScreen();

    for (const shown of ['10th November', '17th November', '24th November']) {
      await swipe(-200);
      await screen.findByText(shown);
    }
    await swipe(-200);
    await screen.findByText('1st December');

    expect(hint('week-strip-back-hint')).toBeOnTheScreen();
    expect(hint('week-strip-forward-hint')).toBeNull();
  });

  test('no chevron points before the week of the first day', async () => {
    answerWeeks('2026-11-04');
    await renderWorkout();
    await screen.findByText('Rest day');
    await screen.findByLabelText(/^Monday 2/);

    expect(
      screen.queryByTestId('week-strip-back-hint', {
        includeHiddenElements: true,
      }),
    ).toBeNull();
    expect(
      screen.queryByTestId('week-strip-forward-hint', {
        includeHiddenElements: true,
      }),
    ).toBeOnTheScreen();
  });

  test('a short swipe stays on the week', async () => {
    answerWeeks('2026-01-01');
    await renderWorkout();
    await screen.findByText('Rest day');

    await swipe(-40);

    expect(screen.getByRole('button', { name: 'Month' })).toBeTruthy();
    expect(screen.getByText('Tue, 3rd November')).toBeOnTheScreen();
  });

  test('Back to today returns from another week', async () => {
    answerWeeks('2026-01-01');
    await renderWorkout();
    await screen.findByText('Rest day');
    await swipe(-200);
    await screen.findByText('10th November');

    await fireEvent.press(
      screen.getByRole('button', { name: 'Back to today' }),
    );

    expect(await screen.findByText('Tue, 3rd November')).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Monday 2/)).toBeOnTheScreen();
  });

  test('a day in another week can be opened', async () => {
    answerWeeks('2026-01-01');
    await renderWorkout();
    await screen.findByText('Rest day');
    await swipe(-200);
    await screen.findByText('10th November');

    await fireEvent.press(screen.getByLabelText(/^Thursday 12/));

    expect(await screen.findByText('12th November')).toBeOnTheScreen();
    expect(requestedDays()).toContain('/api/v1/days/2026-11-12');
  });

  test('it stops at the week of the first day', async () => {
    answerWeeks('2026-11-04');
    await renderWorkout();
    await screen.findByText('Rest day');
    await screen.findByLabelText(/^Monday 2/);

    await swipe(200);

    expect(screen.getByRole('button', { name: 'Month' })).toBeTruthy();
    expect(requestedDays()).not.toContain('/api/v1/days/2026-10-27');
  });

  test('it stops 4 weeks ahead', async () => {
    answerWeeks('2026-01-01');
    await renderWorkout();
    await screen.findByText('Rest day');

    for (const shown of ['10th', '17th', '24th']) {
      await swipe(-200);
      await screen.findByText(`${shown} November`);
    }
    await swipe(-200);
    await screen.findByText('1st December');

    await swipe(-200);

    expect(requestedDays()).not.toContain('/api/v1/days/2026-12-08');
    expect(screen.getByText('1st December')).toBeOnTheScreen();
  });

  test('a screen reader can change the week from any day', async () => {
    answerWeeks('2026-01-01');
    await renderWorkout();
    await screen.findByText('Rest day');
    const monday = screen.getByLabelText(/^Monday 2/);

    expect(monday.props.accessibilityActions).toEqual([
      { name: 'previousWeek', label: 'Previous week' },
      { name: 'nextWeek', label: 'Next week' },
    ]);

    await fireEvent(monday, 'accessibilityAction', {
      nativeEvent: { actionName: 'nextWeek' },
    });

    expect(await screen.findByText('10th November')).toBeOnTheScreen();
  });

  test('a day stays open when the tab comes back after midnight', async () => {
    const listeners: ((state: string) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _type: string,
      listener: (state: string) => void,
    ) => {
      listeners.push(listener);
      return { remove: jest.fn() };
    }) as never);
    answerWeeks('2026-01-01');
    await renderWorkout();
    await screen.findByText('Tue, 3rd November');

    jest.setSystemTime(new Date(2026, 10, 4, 0, 5));
    await act(() => {
      listeners.forEach((listener) => {
        listener('active');
      });
    });

    expect(await screen.findByText('Wed, 4th November')).toBeOnTheScreen();
    expect(requestedDays()).toContain('/api/v1/days/2026-11-04');
  });
});

function OpensAnotherDay() {
  const openDay = useOpenDay();

  return (
    <Button
      label="Open Friday"
      onPress={() => {
        openDay('2026-11-06');
      }}
    />
  );
}

test('a day opened from elsewhere shows selected, with Back to today', async () => {
  answer(restDay);
  await renderRouter(
    {
      _layout: Layout,
      index: OpensAnotherDay,
      'workout/index': () => <WorkoutScreen />,
    },
    { initialUrl: '/' },
  );

  await fireEvent.press(screen.getByRole('button', { name: 'Open Friday' }));

  expect(
    await screen.findByRole('header', { name: 'Friday' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Back to today' }),
  ).toBeOnTheScreen();
});

describe('links from the day', () => {
  async function renderDay(day: unknown = plannedDay) {
    answer(day);
    await renderRouter(
      {
        _layout: Layout,
        'workout/index': () => <WorkoutScreen />,
        'workout/exercise/[id]': OpenedPage,
        'workout/routine/[id]': OpenedPage,
      },
      { initialUrl: '/workout' },
    );
  }

  test('an exercise row opens the exercise', async () => {
    await renderDay();

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Leg press' }),
    );

    expect(await screen.findByText('Opened from day')).toBeOnTheScreen();
  });

  test('the planned routine’s name opens the routine', async () => {
    await renderDay();

    await fireEvent.press(
      await screen.findByRole('link', { name: 'Legs details' }),
    );

    expect(await screen.findByText('Opened from day')).toBeOnTheScreen();
  });

  test('a deleted routine’s name opens nothing', async () => {
    await renderDay({ ...plannedDay, routine: { ...legs, exists: false } });

    expect(await screen.findByText('Legs')).toBeOnTheScreen();
    expect(screen.queryByRole('link', { name: 'Legs details' })).toBeNull();
  });

  test('a deleted exercise’s row opens nothing', async () => {
    await renderDay({
      ...plannedDay,
      routine: {
        ...legs,
        exercises: legs.exercises.map((item) => ({ ...item, exists: false })),
      },
    });

    expect(await screen.findByText('Leg press')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Leg press' })).toBeNull();
  });

  test('the routine up next opens', async () => {
    await renderDay(restDay);

    await fireEvent.press(
      await screen.findByRole('link', { name: 'Arms details' }),
    );

    expect(await screen.findByText('Opened from day')).toBeOnTheScreen();
  });
});
