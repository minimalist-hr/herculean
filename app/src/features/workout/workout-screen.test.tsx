import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { NotificationBar } from '@/components/notification-bar';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ThemeProvider } from '@/theme/theme-provider';

import { WorkoutScreen } from './workout-screen';

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
  exercises: [
    {
      exerciseId: 'squat',
      name: 'Barbell squat',
      groupId: 'legs-group',
      groupName: 'Legs',
      targetSets: 3,
      targetRepsFrom: 8,
      targetRepsTo: 10,
    },
    {
      exerciseId: 'press',
      name: 'Leg press',
      groupId: 'legs-group',
      groupName: 'Legs',
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
  routine: null,
  upNext: { date: '2026-11-04', routineName: 'Arms' },
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

async function renderWorkout() {
  await renderRouter(
    {
      _layout: Layout,
      index: WorkoutScreen,
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

  expect(screen.getByText('Tuesday, 3rd November')).toBeOnTheScreen();
  expect(screen.getByLabelText('Monday 2')).toBeOnTheScreen();
  expect(screen.getByLabelText('Tuesday 3, today')).toBeOnTheScreen();
  expect(screen.getByLabelText('Loading this day')).toBeOnTheScreen();
});

test('shows the planned routine with its exercises and targets', async () => {
  answer(plannedDay);
  await renderWorkout();

  expect(await screen.findByText('Scheduled for Tuesday')).toBeOnTheScreen();
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

  await fireEvent.press(screen.getByRole('button', { name: 'Create routine' }));

  expect(await screen.findByText('New routine screen')).toBeOnTheScreen();
});

test('says the week and the day could not load, and tries again', async () => {
  mockFetch.mockRejectedValue(new TypeError('Network request failed'));
  await renderWorkout();

  expect(await screen.findByText("Couldn't load this day.")).toBeOnTheScreen();
  expect(screen.getByLabelText('Monday 2')).toBeOnTheScreen();

  answer(plannedDay);
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('Legs')).toBeOnTheScreen();
  expect(
    await screen.findByLabelText('Monday 2, Arms, missed'),
  ).toBeOnTheScreen();
});

test.each([
  ['Start workout', 'Logging comes in a later update.'],
  ['Other routine', 'Logging comes in a later update.'],
  ['Skip workout', 'Skipping comes in a later update.'],
  ['Month', 'The month view comes in a later update.'],
])('%s says it comes later', async (name, message) => {
  answer(plannedDay);
  await renderWorkout();
  await screen.findByText('Legs');

  await fireEvent.press(screen.getByRole('button', { name }));

  expect(await screen.findByText(message)).toBeOnTheScreen();
});
