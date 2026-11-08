import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import {
  addMonths,
  dateText,
  dayNameOf,
  monthText,
  weekOf,
} from '@/features/workout/dates';
import { createTestQueryClient } from '@/test-utils/query-client';
import { ThemeProvider } from '@/theme/theme-provider';

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

function stub(name: string) {
  return function Stub() {
    return <Text>{name}</Text>;
  };
}

async function renderHome() {
  await renderRouter({
    _layout: Layout,
    index: HomeScreen,
    workout: stub('Workout page'),
    'workout/day/[date]': stub('Other day page'),
    'workout/month': stub('Month page'),
    'exercises/[id]': stub('Exercise page'),
    'workout/log/w1': stub('Logging page'),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
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
  expect(await screen.findByText('9')).toBeOnTheScreen();
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

  expect(await screen.findByText('Best 11')).toBeOnTheScreen();
});

test('This month compares with last month', async () => {
  answerWith();
  await renderHome();

  expect(await screen.findByText('+2')).toBeOnTheScreen();
  expect(screen.getByText('+5%')).toBeOnTheScreen();
  expect(screen.getByText('+10%')).toBeOnTheScreen();
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
  [`/api/v1/days/${today}`, "Couldn't load today."],
  ['/api/v1/days', "Couldn't load this week."],
  [`/api/v1/month-summaries/${thisMonth}`, "Couldn't load this month."],
  ['/api/v1/streak', "Couldn't load your streak."],
  ['/api/v1/records/recent', "Couldn't load your records."],
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

test('the links open the day, the month and an exercise', async () => {
  answerWith();
  await renderHome();

  await fireEvent.press(
    await screen.findByRole('link', { name: 'Open month' }),
  );
  expect(await screen.findByText('Month page')).toBeOnTheScreen();
});

test('another day of the week opens that day', async () => {
  answerWith();
  await renderHome();
  const days = weekOf(now);
  const other = days[dateText(days[0]) === today ? 1 : 0];

  await fireEvent.press(
    await screen.findByRole('button', {
      name: new RegExp(`^${dayNameOf(other).full} ${String(other.getDate())},`),
    }),
  );

  expect(await screen.findByText('Other day page')).toBeOnTheScreen();
});

test('a record opens its exercise', async () => {
  answerWith();
  await renderHome();

  await fireEvent.press(
    await screen.findByRole('button', { name: /^Bench press, / }),
  );

  expect(await screen.findByText('Exercise page')).toBeOnTheScreen();
});

test('Open day opens the workout tab', async () => {
  answerWith();
  await renderHome();

  await fireEvent.press(await screen.findByRole('link', { name: 'Open day' }));

  expect(await screen.findByText('Workout page')).toBeOnTheScreen();
});
