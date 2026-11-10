import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState, type ReactElement } from 'react';
import { AppState, Text, type RefreshControlProps } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import { addMonths, dateText, monthText, weekOf } from '@/formats/dates';
import { dayNameOf } from '@/formats/formats';
import { createTestQueryClient } from '@/test-utils/query-client';
import { ThemeProvider } from '@/theme/theme-provider';

import { takeOpenedDay } from '@/features/workout/open-day';
import { HomeScreen } from './home-screen';

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

const now = new Date();
const today = dateText(now);
const week = weekOf(now).map(dateText);
const thisMonth = monthText(now);
const lastMonth = addMonths(thisMonth, -1);

const legs = {
  id: 'legs',
  name: 'Legs',
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
  ],
};

const plannedDay = {
  date: today,
  status: 'planned',
  hasRoutines: true,
  workoutId: null,
  routine: legs,
  upNext: { date: week[6], routineName: 'Arms' },
};

const month = {
  done: 9,
  missed: 1,
  skipped: 0,
  minutesTrained: 500,
  setsDone: 100,
  setsPlanned: 110,
  volumeKg: 11000,
  plannedDays: 10,
  consistencyPercent: 90,
};

const previousMonth = {
  ...month,
  done: 7,
  volumeKg: 10000,
  consistencyPercent: 85,
};

const records = [
  {
    exerciseId: 'bench',
    exerciseName: 'Bench press',
    weightKg: 82.5,
    reps: 10,
    date: today,
  },
];

const defaults = (): Record<string, unknown> => ({
  [`/api/v1/days/${today}`]: plannedDay,
  '/api/v1/days': week.map((date, index) => ({
    date,
    status: index % 2 === 0 ? 'completed' : 'rest',
    routineName: index % 2 === 0 ? 'Legs' : null,
  })),
  [`/api/v1/month-summaries/${thisMonth}`]: month,
  [`/api/v1/month-summaries/${lastMonth}`]: previousMonth,
  '/api/v1/streak': { weeks: 6, best: 11 },
  '/api/v1/records/recent': records,
  '/api/v1/users/me': {
    email: 'filip@example.com',
    name: 'Filip M',
    units: 'metric',
    timeZone: 'Europe/Zagreb',
  },
  '/api/v1/users/me/photo': { image: null },
  '/api/v1/workouts': [],
  '/api/v1/workouts/w1': {
    id: 'w1',
    startedAtUtc: new Date().toISOString(),
    exercises: [
      { exerciseId: 'squat', sets: [{ checked: true }, { checked: false }] },
    ],
  },
  '/api/v1/workouts/w1/summary': { setsChecked: 12, durationSeconds: 3600 },
});

function answerWith(overrides: Record<string, unknown> = {}) {
  const answers = { ...defaults(), ...overrides };
  mockFetch.mockImplementation((request) => {
    const answer = answers[new URL(request.url).pathname];
    if (answer === undefined) {
      return Promise.resolve(Response.json([]));
    }

    return Promise.resolve(
      typeof answer === 'number'
        ? new Response(null, { status: answer })
        : Response.json(answer),
    );
  });
}

let client = createTestQueryClient();

function Layout() {
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider theme="dark">
        <Stack screenOptions={{ headerShown: false }} />
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function stub(name: string) {
  return function Stub() {
    return <Text>{name}</Text>;
  };
}

function stubOpenedFrom(name: string) {
  return function Stub() {
    const { from } = useLocalSearchParams<{ from?: string }>();

    return <Text>{`${name}, from ${String(from)}`}</Text>;
  };
}

/** The Workout tab, with the day it was opened on. */
function WorkoutStub() {
  const [opened] = useState(takeOpenedDay);

  return <Text>{`Workout page, on ${String(opened)}`}</Text>;
}

async function renderHome() {
  await renderRouter({
    _layout: Layout,
    index: HomeScreen,
    workout: WorkoutStub,
    'workout/month': stub('Month page'),
    'exercises/[id]': stubOpenedFrom('Exercise page'),
    'workout/log/w1': stub('Logging page'),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  client = createTestQueryClient();
});

test('greets by first name and shows every section', async () => {
  answerWith();
  await renderHome();

  expect(
    await screen.findByText(/^Good (morning|afternoon|evening), Filip$/),
  ).toBeOnTheScreen();
  expect(await screen.findByText('Legs')).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Start workout' }),
  ).toBeOnTheScreen();
  expect(await screen.findByText('4 of 4 done')).toBeOnTheScreen();
  expect(await screen.findByText('90%')).toBeOnTheScreen();
  expect(await screen.findByText('6 weeks on plan')).toBeOnTheScreen();
  expect(await screen.findByText('Bench press')).toBeOnTheScreen();
});

test('Start workout asks first, and starts only when confirmed', async () => {
  answerWith();
  const answerRest = mockFetch.getMockImplementation();
  mockFetch.mockImplementation((request) =>
    request.method === 'POST'
      ? Promise.resolve(Response.json({ id: 'w1' }))
      : (answerRest?.(request) ?? Promise.reject(new Error('No answer'))),
  );
  await renderHome();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Start workout' }),
  );

  expect(await screen.findByText('Are you ready?')).toBeOnTheScreen();
  expect(screen.getByText('Legs · 1 exercise · 3 sets')).toBeOnTheScreen();
  expect(mockFetch.mock.calls.some(([sent]) => sent.method === 'POST')).toBe(
    false,
  );

  const [, confirm] = screen.getAllByRole('button', { name: 'Start workout' });
  await fireEvent.press(confirm);

  expect(await screen.findByText('Logging page')).toBeOnTheScreen();
});

test('the streak shows the best so far, and none before the first', async () => {
  answerWith({ '/api/v1/streak': { weeks: 2, best: 11 } });
  await renderHome();

  expect(await screen.findByText('Best 11 weeks')).toBeOnTheScreen();
});

test('a workout in progress shows its sets and the time so far', async () => {
  answerWith({
    [`/api/v1/days/${today}`]: {
      ...plannedDay,
      status: 'inProgress',
      workoutId: 'w1',
    },
  });
  await renderHome();

  expect(await screen.findByText(/^1 of 2 sets · \d/)).toBeOnTheScreen();
});

test('This month compares with last month', async () => {
  answerWith();
  await renderHome();

  expect(await screen.findByText('+2')).toBeOnTheScreen();
  expect(screen.getByText('+5 pts')).toBeOnTheScreen();
  expect(screen.getByText('+10%')).toBeOnTheScreen();
});

test('a change of one point reads in the singular', async () => {
  answerWith({
    [`/api/v1/month-summaries/${lastMonth}`]: {
      ...previousMonth,
      consistencyPercent: 89,
    },
  });
  await renderHome();

  expect(await screen.findByText('+1 pt')).toBeOnTheScreen();
});

test('a last month with nothing in it has nothing to compare', async () => {
  const empty = {
    ...month,
    done: 0,
    plannedDays: 0,
    volumeKg: 0,
    consistencyPercent: null,
  };
  answerWith({
    [`/api/v1/month-summaries/${thisMonth}`]: empty,
    [`/api/v1/month-summaries/${lastMonth}`]: empty,
  });
  await renderHome();

  expect(await screen.findAllByText('–')).toHaveLength(4);
  expect(screen.queryByText('Same')).toBeNull();
});

test.each([
  ['metric', 11000, '11.0 t'],
  ['imperial', 11000, '24.3k lb'],
  ['metric', 500, '500 kg'],
])('volume in %s of %d reads %s', async (units, volumeKg, shown) => {
  answerWith({
    '/api/v1/users/me': {
      email: 'filip@example.com',
      name: 'Filip',
      units,
      timeZone: 'Europe/Zagreb',
    },
    [`/api/v1/month-summaries/${thisMonth}`]: { ...month, volumeKg },
  });
  await renderHome();

  expect(await screen.findByText(shown)).toBeOnTheScreen();
});

test('with nothing to compare, the changes say so', async () => {
  answerWith({
    [`/api/v1/month-summaries/${lastMonth}`]: 500,
    [`/api/v1/month-summaries/${thisMonth}`]: {
      ...month,
      consistencyPercent: null,
    },
  });
  await renderHome();

  expect((await screen.findAllByText('–')).length).toBeGreaterThanOrEqual(3);
});

test('the same number as last month says Same, and a drop has a minus', async () => {
  answerWith({
    [`/api/v1/month-summaries/${thisMonth}`]: {
      ...previousMonth,
      volumeKg: 9000,
    },
  });
  await renderHome();

  expect((await screen.findAllByText('Same')).length).toBe(2);
  expect(screen.getByText('−10%')).toBeOnTheScreen();
});

test.each([
  [
    'in progress',
    { ...plannedDay, status: 'inProgress', workoutId: 'w1' },
    'Resume workout',
  ],
])('%s offers its action', async (_, day, action) => {
  answerWith({ [`/api/v1/days/${today}`]: day });
  await renderHome();

  await fireEvent.press(await screen.findByRole('button', { name: action }));

  expect(await screen.findByText('Logging page')).toBeOnTheScreen();
});

test.each([
  ['done', { ...plannedDay, status: 'completed', workoutId: 'w1' }, 'Done'],
  ['skipped', { ...plannedDay, status: 'skipped', workoutId: 'w1' }, 'Skipped'],
  ['a rest day', { ...plannedDay, status: 'rest', routine: null }, 'Rest day'],
])('%s shows what comes next instead of a button', async (_, day, label) => {
  answerWith({ [`/api/v1/days/${today}`]: day });
  await renderHome();

  expect(await screen.findByText(label)).toBeOnTheScreen();
  expect(await screen.findByText('Arms')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Start workout' })).toBeNull();
});

test('with no routines it offers the first one', async () => {
  answerWith({
    [`/api/v1/days/${today}`]: {
      ...plannedDay,
      status: 'rest',
      routine: null,
      hasRoutines: false,
    },
  });
  await renderHome();

  expect(await screen.findByText('No routines yet')).toBeOnTheScreen();
});

test('one week reads in the singular, and none invites a first', async () => {
  answerWith({ '/api/v1/streak': { weeks: 1, best: 1 } });
  await renderHome();
  expect(await screen.findByText('1 week on plan')).toBeOnTheScreen();
});

test('a streak that ended keeps the best and says there is none right now', async () => {
  answerWith({ '/api/v1/streak': { weeks: 0, best: 4 } });
  await renderHome();

  expect(await screen.findByText('No streak right now')).toBeOnTheScreen();
  expect(screen.getByText('Best 4 weeks')).toBeOnTheScreen();
  expect(screen.queryByText('No streak yet')).toBeNull();
});

test('an empty account keeps every section with empty copy', async () => {
  answerWith({
    '/api/v1/streak': { weeks: 0, best: 0 },
    '/api/v1/records/recent': [],
  });
  await renderHome();

  expect(await screen.findByText('No streak yet')).toBeOnTheScreen();
  expect(screen.queryByText(/^Best /)).toBeNull();
  expect(await screen.findByText('No records yet')).toBeOnTheScreen();
});

test.each([
  [`/api/v1/days/${today}`, 'Couldn’t load today.'],
  ['/api/v1/days', 'Couldn’t load the week.'],
  [`/api/v1/month-summaries/${thisMonth}`, 'Couldn’t load this month.'],
  ['/api/v1/streak', 'Couldn’t load your streak.'],
  ['/api/v1/records/recent', 'Couldn’t load your records.'],
])(
  '%s failing leaves the rest, and Try again reloads it',
  async (path, message) => {
    answerWith({ [path]: 500 });
    await renderHome();

    expect(await screen.findByText(message)).toBeOnTheScreen();
    expect(screen.getAllByRole('link', { name: 'Try again' })).toHaveLength(1);

    answerWith();
    await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

    await waitFor(() => {
      expect(screen.queryByText(message)).toBeNull();
    });
  },
);

test('a planned day names its weekday, like the Workout tab', async () => {
  answerWith();
  await renderHome();

  expect(
    await screen.findByText(`Planned for ${dayNameOf(now).full}`),
  ).toBeOnTheScreen();
});

test('a day that was done says so to screen readers', async () => {
  answerWith();
  await renderHome();

  expect(
    (await screen.findAllByRole('button', { name: /, Legs, done/ })).length,
  ).toBeGreaterThan(0);
});

test('pulling down reads everything again and keeps what is showing', async () => {
  answerWith();
  await renderHome();
  expect(await screen.findByText('6 weeks on plan')).toBeOnTheScreen();
  mockFetch.mockClear();

  const { refreshControl } = screen.getByTestId('home-scroll').props as {
    refreshControl: ReactElement<RefreshControlProps>;
  };
  await act(() => {
    void refreshControl.props.onRefresh?.();
  });

  await waitFor(() => {
    const read = mockFetch.mock.calls.map(
      ([request]) => new URL(request.url).pathname,
    );
    expect(read).toEqual(
      expect.arrayContaining(['/api/v1/streak', '/api/v1/records/recent']),
    );
  });
  expect(screen.getByText('6 weeks on plan')).toBeOnTheScreen();
});

test('a refresh that fails keeps what is showing', async () => {
  const listeners: ((state: string) => void)[] = [];
  // Once: restoring a spy on React Native's own mock would leave it empty.
  jest.spyOn(AppState, 'addEventListener').mockImplementationOnce(((
    _type: string,
    listener: (state: string) => void,
  ) => {
    listeners.push(listener);
    return { remove: jest.fn() };
  }) as never);
  answerWith();
  await renderHome();
  expect(await screen.findByText('6 weeks on plan')).toBeOnTheScreen();
  expect(await screen.findByText('Bench press')).toBeOnTheScreen();

  answerWith({
    '/api/v1/days': 500,
    [`/api/v1/month-summaries/${thisMonth}`]: 500,
    '/api/v1/streak': 500,
    '/api/v1/records/recent': 500,
  });
  await act(() => {
    listeners.forEach((listener) => {
      listener('active');
    });
  });
  await waitFor(() => {
    expect(client.isFetching()).toBe(0);
  });

  // The screen updates a moment after the query, so this watches for a while.
  await expect(
    screen.findByRole('link', { name: 'Try again' }, { timeout: 300 }),
  ).rejects.toThrow();
  expect(screen.getByText('6 weeks on plan')).toBeOnTheScreen();
  expect(screen.getByText('Bench press')).toBeOnTheScreen();
});

test('the links open the day, the month and an exercise', async () => {
  answerWith();
  await renderHome();

  await fireEvent.press(
    await screen.findByRole('link', { name: 'Open month' }),
  );
  expect(await screen.findByText('Month page')).toBeOnTheScreen();
});

test('another day of the week opens the Workout tab on that day', async () => {
  answerWith();
  await renderHome();
  const days = weekOf(now);
  const other = days[dateText(days[0]) === today ? 1 : 0];

  await fireEvent.press(
    await screen.findByRole('button', {
      name: new RegExp(`^${dayNameOf(other).full} ${String(other.getDate())},`),
    }),
  );

  expect(
    await screen.findByText(`Workout page, on ${dateText(other)}`),
  ).toBeOnTheScreen();
});

test('a record opens its exercise', async () => {
  answerWith();
  await renderHome();

  await fireEvent.press(
    await screen.findByRole('button', { name: /^Bench press, / }),
  );

  expect(await screen.findByText('Exercise page, from home')).toBeOnTheScreen();
});

test('Open day opens the Workout tab on today', async () => {
  answerWith();
  await renderHome();

  await fireEvent.press(await screen.findByRole('link', { name: 'Open day' }));

  expect(
    await screen.findByText(`Workout page, on ${today}`),
  ).toBeOnTheScreen();
});
