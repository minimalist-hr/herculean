import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { ThemeProvider } from '@/theme/theme-provider';

import { WorkoutDetailsScreen } from './workout-details-screen';

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

function exercise(
  id: string,
  name: string,
  sets: [number, number][],
  lastTime: [number, number][] | null = null,
) {
  return {
    id,
    exerciseId: `exercise-${id}`,
    name,
    groupId: 'back',
    groupName: 'Back',
    targetSets: sets.length,
    targetRepsFrom: 8,
    targetRepsTo: 10,
    sets: sets.map(([weightKg, reps], order) => ({
      id: `${id}-${String(order)}`,
      order,
      weightKg,
      reps,
      checked: true,
    })),
    lastTime:
      lastTime === null
        ? null
        : {
            date: '2026-10-13',
            sets: lastTime.map(([weightKg, reps]) => ({ weightKg, reps })),
          },
  };
}

const workout = {
  id: 'w1',
  date: '2026-10-20',
  status: 'completed',
  name: 'Back',
  exercises: [
    exercise(
      'row',
      'Machine row',
      [
        [65, 10],
        [70, 8],
      ],
      [[60, 10]],
    ),
    exercise('pull', 'Pull-up', [
      [0, 10],
      [0, 9],
    ]),
  ],
};

const summary = {
  name: 'Back',
  date: '2026-10-20',
  durationSeconds: 3130,
  setsChecked: 4,
  setsTotal: 4,
  volumeKg: 1210,
  uncheckedExercises: [],
  records: [
    { name: 'Machine row', kind: 'heaviestWeight', weightKg: 70, reps: 8 },
  ],
};

function answer({
  units = 'metric',
  summaryAnswer = summary,
  status = 200,
}: { units?: string; summaryAnswer?: unknown; status?: number } = {}) {
  mockFetch.mockImplementation((request) => {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/v1/users/me') {
      return Promise.resolve(Response.json({ units }));
    }
    if (status !== 200) {
      return Promise.resolve(new Response(null, { status }));
    }
    return Promise.resolve(
      Response.json(pathname.endsWith('/summary') ? summaryAnswer : workout),
    );
  });
}

function Layout() {
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ThemeProvider theme="dark">
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function renderDetails() {
  await renderRouter(
    {
      _layout: Layout,
      index: () => <WorkoutDetailsScreen id="w1" />,
    },
    { initialUrl: '/' },
  );
}

beforeEach(() => {
  mockFetch.mockReset();
});

test('shows what the workout came to, with Sets as one number', async () => {
  answer();
  await renderDetails();

  expect(await screen.findByRole('header', { name: 'Back' })).toBeOnTheScreen();
  expect(screen.getByText('Done · Tue, 20th October')).toBeOnTheScreen();
  expect(await screen.findByText('52:10')).toBeOnTheScreen();
  expect(screen.getByText('4')).toBeOnTheScreen();
  expect(screen.queryByText('4 / 4')).toBeNull();
  expect(screen.getAllByText('1,210 kg').length).toBeGreaterThan(0);
});

test('a past day has a dash for its duration', async () => {
  answer({ summaryAnswer: { ...summary, durationSeconds: null } });
  await renderDetails();

  expect((await screen.findAllByText('—')).length).toBeGreaterThan(0);
  expect(screen.queryByText('52:10')).toBeNull();
});

test('lists new records', async () => {
  answer();
  await renderDetails();

  expect(await screen.findByText('New records')).toBeOnTheScreen();
  expect(screen.getByText('70 kg × 8')).toBeOnTheScreen();
});

test('with no records the records section says so', async () => {
  answer({ summaryAnswer: { ...summary, records: [] } });
  await renderDetails();
  await screen.findByText('Exercises');

  expect(screen.getByText('New records')).toBeOnTheScreen();
  expect(screen.getByText('No new records this time.')).toBeOnTheScreen();
});

test('each set shows last time, weight and reps', async () => {
  answer();
  await renderDetails();

  expect(await screen.findByText('60 × 10')).toBeOnTheScreen();
  expect(screen.getByText('65')).toBeOnTheScreen();
  expect(screen.getAllByText('Last time').length).toBe(2);
  expect(screen.getAllByText('kg').length).toBe(2);
});

test('the record set is in the accent color', async () => {
  answer();
  await renderDetails();

  const weight = await screen.findByText('70');

  expect(weight.props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ color: '#7EA2FF' })]),
  );
});

test('a bodyweight exercise shows its reps as the total, with no weight', async () => {
  answer();
  await renderDetails();

  expect(await screen.findByText('19 reps')).toBeOnTheScreen();
});

test('weights follow the units setting', async () => {
  answer({ units: 'imperial' });
  await renderDetails();

  expect(await screen.findByText('143.3')).toBeOnTheScreen();
  expect(screen.getAllByText('lb').length).toBe(2);
  expect(screen.queryByText('kg')).toBeNull();
  expect(screen.getByText('154.3 lb × 8')).toBeOnTheScreen();
});

test('the back link is Workout, unless it says where it opened from', async () => {
  answer();
  await renderDetails();

  expect(await screen.findByRole('link', { name: 'Workout' })).toBeTruthy();
});

test('from the month, the back link says Month', async () => {
  answer();
  await renderRouter(
    {
      _layout: Layout,
      index: () => <WorkoutDetailsScreen id="w1" backLabel="Month" />,
    },
    { initialUrl: '/' },
  );

  expect(await screen.findByRole('link', { name: 'Month' })).toBeTruthy();
});

test('a load failure can be tried again', async () => {
  answer({ status: 500 });
  await renderDetails();

  expect(
    await screen.findByText("Couldn't load this workout."),
  ).toBeOnTheScreen();

  answer();
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('Exercises')).toBeOnTheScreen();
});
