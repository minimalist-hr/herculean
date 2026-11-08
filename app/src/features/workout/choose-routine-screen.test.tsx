import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { NotificationBar } from '@/components/notification-bar';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ThemeProvider } from '@/theme/theme-provider';

import { ChooseRoutineScreen } from './choose-routine-screen';
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

const push = {
  id: 'push',
  name: 'Push',
  exerciseCount: 7,
  setCount: 19,
  weekdays: ['monday'],
  lastDoneOn: '2026-10-19',
};
const legs = {
  id: 'legs',
  name: 'Legs',
  exerciseCount: 1,
  setCount: 3,
  weekdays: ['wednesday'],
  lastDoneOn: null,
};
const notInPlan = {
  id: 'arms',
  name: 'Arms',
  exerciseCount: 4,
  setCount: 10,
  weekdays: [],
  lastDoneOn: null,
};

const restDay = { date: '2026-11-03', status: 'rest', routine: null };
const legsDay = {
  ...restDay,
  status: 'planned',
  routine: { id: 'legs', name: 'Legs', exercises: [] },
};

const details = {
  id: 'push',
  name: 'Push',
  weekdays: ['monday'],
  exercises: [
    {
      exerciseId: 'press',
      name: 'Bench press',
      groupId: 'chest',
      groupName: 'Chest',
      targetSets: 3,
      targetRepsFrom: 8,
      targetRepsTo: 10,
    },
  ],
};

interface Answers {
  routines?: unknown;
  day?: unknown;
  routine?: () => Response;
  start?: () => Response;
}

function answer({
  routines = [legs, push],
  day = restDay,
  routine = () => Response.json(details),
  start = () =>
    Response.json({ id: 'new-workout', status: 'inProgress' }, { status: 201 }),
}: Answers) {
  mockFetch.mockImplementation((request) => {
    const { pathname } = new URL(request.url);
    if (request.method === 'POST') {
      return Promise.resolve(start());
    }
    if (pathname === '/api/v1/routines') {
      return Promise.resolve(Response.json(routines));
    }
    if (pathname.startsWith('/api/v1/routines/')) {
      return Promise.resolve(routine());
    }
    return Promise.resolve(Response.json(day));
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

function ChooseRoute() {
  const { date } = useLocalSearchParams<{ date: string }>();

  return <ChooseRoutineScreen date={date} />;
}

async function renderChoose(date = '2026-11-03') {
  await renderRouter(
    {
      _layout: Layout,
      index: () => <PlaceholderScreen title="Day screen" />,
      'choose/[date]': ChooseRoute,
      'workout/log/[id]': () => <PlaceholderScreen title="Logging screen" />,
    },
    { initialUrl: `/choose/${date}` },
  );
}

async function pick(name: RegExp) {
  await fireEvent.press(await screen.findByRole('button', { name }));
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

test('lists only the routines in the week plan', async () => {
  answer({ routines: [push, notInPlan] });
  await renderChoose();

  expect(await screen.findByText('Push')).toBeOnTheScreen();
  expect(screen.queryByText('Arms')).toBeNull();
  expect(
    screen.getByText('For this day only. Your schedule stays the same.'),
  ).toBeOnTheScreen();
});

test('says when each routine was last done', async () => {
  answer({});
  await renderChoose();

  expect(
    await screen.findByText('7 exercises · last done Mon, 19th Oct'),
  ).toBeOnTheScreen();
  expect(screen.getByText('1 exercise · not done yet')).toBeOnTheScreen();
});

test('the planned routine comes first, with its tag', async () => {
  answer({ routines: [push, legs], day: legsDay });
  await renderChoose();

  const rows = await screen.findAllByRole('button', { name: /exercise/ });

  expect(rows.map((row) => row.props.accessibilityLabel as string)).toEqual([
    'Legs, planned, 1 exercise · not done yet',
    'Push, 7 exercises · last done Mon, 19th Oct',
  ]);
  expect(screen.getByText('Planned')).toBeOnTheScreen();
});

test('a rest day has no tag', async () => {
  answer({});
  await renderChoose();
  await screen.findByText('Push');

  expect(screen.queryByText('Planned')).toBeNull();
});

test('a planned routine that has left the week plan still comes first', async () => {
  answer({
    routines: [push, { ...legs, weekdays: [] }],
    day: legsDay,
  });
  await renderChoose();

  const rows = await screen.findAllByRole('button', { name: /exercise/ });

  expect(rows[0]?.props.accessibilityLabel).toContain('Legs, planned');
  expect(rows).toHaveLength(2);
});

test('with nothing in the week plan, it says so', async () => {
  answer({ routines: [notInPlan] });
  await renderChoose();

  expect(
    await screen.findByText('No routines in your week plan'),
  ).toBeOnTheScreen();
  expect(
    screen.queryByText('For this day only. Your schedule stays the same.'),
  ).toBeNull();
});

test('if the day fails to load, the routines still show, without a planned one', async () => {
  answer({});
  const answered = mockFetch.getMockImplementation();
  mockFetch.mockImplementation((request) =>
    new URL(request.url).pathname.startsWith('/api/v1/days/')
      ? Promise.resolve(new Response(null, { status: 500 }))
      : (answered?.(request) ?? Promise.reject(new Error('unanswered'))),
  );
  await renderChoose();

  expect(await screen.findByText('Push')).toBeOnTheScreen();
  expect(screen.queryByText('Planned')).toBeNull();
  expect(screen.queryByText("Couldn't load your routines.")).toBeNull();
});

test('a list that fails to load can be tried again', async () => {
  mockFetch.mockResolvedValue(new Response(null, { status: 500 }));
  await renderChoose();

  expect(
    await screen.findByText("Couldn't load your routines."),
  ).toBeOnTheScreen();

  answer({});
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('Push')).toBeOnTheScreen();
});

test('picking a routine asks first and shows its exercises', async () => {
  answer({});
  await renderChoose();

  await pick(/^Push/);

  expect(await screen.findByText('Start Push?')).toBeOnTheScreen();
  expect(await screen.findByText('Bench press')).toBeOnTheScreen();
  expect(
    mockFetch.mock.calls.filter(([request]) => request.method === 'POST'),
  ).toHaveLength(0);
});

test('a past day logs instead of starting', async () => {
  answer({});
  await renderChoose('2026-11-02');

  await pick(/^Push/);

  expect(await screen.findByText('Log Push?')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Log workout' })).toBeTruthy();
});

test('exercises that fail to load can be tried again, and it can still start', async () => {
  answer({ routine: () => new Response(null, { status: 500 }) });
  await renderChoose();

  await pick(/^Push/);

  expect(
    await screen.findByText("Couldn't load this routine."),
  ).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Start workout' })).toBeTruthy();

  answer({});
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('Bench press')).toBeOnTheScreen();
});

test('confirming starts that routine for that day and opens logging', async () => {
  answer({});
  await renderChoose();

  await pick(/^Push/);
  await screen.findByText('Bench press');
  await fireEvent.press(screen.getByRole('button', { name: 'Start workout' }));

  expect(await screen.findByText('Logging screen')).toBeOnTheScreen();
  const post = mockFetch.mock.calls.find(
    ([request]) => request.method === 'POST',
  )?.[0];
  expect(await post?.clone().json()).toEqual({
    date: '2026-11-03',
    status: 'inProgress',
    routineId: 'push',
  });
});

test('a start that fails says why, and the sheet stays open', async () => {
  answer({ start: () => new Response(null, { status: 500 }) });
  await renderChoose();

  await pick(/^Push/);
  await screen.findByText('Bench press');
  await fireEvent.press(screen.getByRole('button', { name: 'Start workout' }));

  expect(
    await screen.findByText("Couldn't start the workout. Try again."),
  ).toBeOnTheScreen();
  expect(screen.getByText('Start Push?')).toBeOnTheScreen();
});

test('closing the sheet returns to the list without starting', async () => {
  answer({});
  await renderChoose();

  await pick(/^Push/);
  await screen.findByText('Start Push?');
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));

  await waitFor(() => {
    expect(screen.queryByText('Start Push?')).toBeNull();
  });
  expect(screen.getByText('Choose a routine')).toBeOnTheScreen();
  expect(
    mockFetch.mock.calls.filter(([request]) => request.method === 'POST'),
  ).toHaveLength(0);
});
