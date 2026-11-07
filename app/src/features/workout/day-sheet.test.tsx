import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { ThemeProvider } from '@/theme/theme-provider';

import { DaySheet } from './day-sheet';

const mockFetch = jest.fn<Promise<Response>, [Request]>();
const onViewWorkout = jest.fn<undefined, [string]>();

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

const savedDay = {
  date: '2026-11-02',
  status: 'completed',
  hasRoutines: true,
  workoutId: 'w1',
  routine: { id: 'legs', name: 'Legs', exercises: [] },
  upNext: { date: '2026-11-03', routineName: null },
};

const workout = {
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

const summary = {
  name: 'Legs',
  date: '2026-11-02',
  durationSeconds: 3120,
  setsChecked: 2,
  setsTotal: 2,
  volumeKg: 1000,
  uncheckedExercises: [],
  records: [],
};

function answer({
  day = savedDay,
  summaryAnswer = summary,
  units = 'metric',
  failing = false,
}: {
  day?: unknown;
  summaryAnswer?: unknown;
  units?: string;
  failing?: boolean;
} = {}) {
  mockFetch.mockImplementation((request) => {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/v1/users/me') {
      return Promise.resolve(Response.json({ units }));
    }
    if (pathname.startsWith('/api/v1/workouts/')) {
      if (failing) {
        return Promise.resolve(new Response(null, { status: 500 }));
      }
      return Promise.resolve(
        Response.json(pathname.endsWith('/summary') ? summaryAnswer : workout),
      );
    }
    return Promise.resolve(Response.json(day));
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

async function renderSheet() {
  await renderRouter(
    {
      _layout: Layout,
      index: () => (
        <DaySheet
          date="2026-11-02"
          visible
          today="2026-11-03"
          onClose={() => undefined}
          onOpenDay={() => undefined}
          onViewWorkout={onViewWorkout}
        />
      ),
    },
    { initialUrl: '/' },
  );
}

beforeEach(() => {
  mockFetch.mockReset();
  onViewWorkout.mockReset();
});

test('a saved day shows its tiles and the sets done', async () => {
  answer();
  await renderSheet();

  expect(await screen.findByText('Done · Mon, 2nd November')).toBeOnTheScreen();
  expect(await screen.findByText('52 min')).toBeOnTheScreen();
  expect(screen.getByText('1,000 kg')).toBeOnTheScreen();
  expect(await screen.findByText(/^2 sets/)).toBeOnTheScreen();
});

test('a day logged later has a dash for its time', async () => {
  answer({ summaryAnswer: { ...summary, durationSeconds: null } });
  await renderSheet();

  expect(await screen.findByText('—')).toBeOnTheScreen();
});

test('volume follows the units setting', async () => {
  answer({ units: 'imperial' });
  await renderSheet();

  expect(await screen.findByText('2,205 lb')).toBeOnTheScreen();
});

test('View workout opens that workout, with Open day as well', async () => {
  answer();
  await renderSheet();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'View workout' }),
  );

  expect(onViewWorkout).toHaveBeenCalledWith('w1');
  expect(screen.getByRole('button', { name: 'Open day' })).toBeTruthy();
});

test('a day with nothing saved only opens the day', async () => {
  answer({ day: { ...savedDay, status: 'missed', workoutId: null } });
  await renderSheet();

  expect(await screen.findByRole('button', { name: 'Open day' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'View workout' })).toBeNull();
});

test('details that fail to load can be tried again', async () => {
  answer({ failing: true });
  await renderSheet();

  expect(
    await screen.findByText("Couldn't load the summary."),
  ).toBeOnTheScreen();
  expect(screen.getByText("Couldn't load the exercises.")).toBeOnTheScreen();

  answer();
  for (const retry of screen.getAllByRole('link', { name: 'Try again' })) {
    await fireEvent.press(retry);
  }

  expect(await screen.findByText(/^2 sets/)).toBeOnTheScreen();
});
