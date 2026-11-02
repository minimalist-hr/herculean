import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ThemeProvider } from '@/theme/theme-provider';

import { RoutinesScreen } from './routines-screen';

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

const weekdays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

function restWeek() {
  return weekdays.map((weekday) => ({
    weekday,
    routineId: null,
    routineName: null,
  }));
}

function answer(routines: unknown[], days: unknown[] = restWeek()) {
  mockFetch.mockImplementation((request) =>
    Promise.resolve(
      Response.json(
        new URL(request.url).pathname === '/api/v1/routines' ? routines : days,
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function renderRoutines() {
  await renderRouter(
    {
      _layout: Layout,
      index: RoutinesScreen,
      'new-routine': () => <PlaceholderScreen title="New routine screen" />,
      'routine/[id]': () => <PlaceholderScreen title="Routine screen" />,
    },
    { initialUrl: '/' },
  );
}

const legs = {
  id: 'legs',
  name: 'Legs',
  exerciseCount: 4,
  setCount: 10,
  weekdays: ['monday', 'friday'],
};

beforeEach(() => {
  mockFetch.mockReset();
});

test('shows the skeleton, then the week plan and the routines', async () => {
  const days = restWeek();
  days[0] = {
    weekday: 'monday',
    routineId: 'legs',
    routineName: 'Legs',
  } as never;
  answer([legs], days);
  await renderRoutines();

  expect(screen.getByLabelText('Loading your routines')).toBeOnTheScreen();

  expect(await screen.findByText('Monday')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Loading your routines')).toBeNull();
  expect(screen.getByText('Repeats every week')).toBeOnTheScreen();
  expect(screen.getByText('Sunday')).toBeOnTheScreen();
  expect(screen.getAllByText('Rest day')).toHaveLength(6);
  expect(screen.getByText('4 exercises · 10 sets')).toBeOnTheScreen();
  expect(screen.getByText('Mon, Fri')).toBeOnTheScreen();
});

test('one exercise and one set read in the singular', async () => {
  answer([{ ...legs, exerciseCount: 1, setCount: 1, weekdays: [] }]);
  await renderRoutines();

  expect(await screen.findByText('1 exercise · 1 set')).toBeOnTheScreen();
});

test('without routines it says what to do', async () => {
  answer([]);
  await renderRoutines();

  expect(await screen.findByText('No routines yet')).toBeOnTheScreen();
  expect(
    screen.getByText('Create a routine, then plan it on the days you train.'),
  ).toBeOnTheScreen();
  expect(screen.getAllByText('Rest day')).toHaveLength(7);
});

test('a failed read says so, and Try again reads both again', async () => {
  mockFetch.mockRejectedValue(new TypeError('Network request failed'));
  await renderRoutines();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't load your routines.",
  );

  answer([legs]);
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('Monday')).toBeOnTheScreen();
  expect(screen.getByText('Legs')).toBeOnTheScreen();
});

test('the + button opens a new routine', async () => {
  answer([]);
  await renderRoutines();

  await fireEvent.press(screen.getByRole('button', { name: 'New routine' }));

  expect(await screen.findByText('New routine screen')).toBeOnTheScreen();
});

test('a routine opens it', async () => {
  answer([legs]);
  await renderRoutines();

  await fireEvent.press(await screen.findByRole('button', { name: /^Legs/ }));

  expect(await screen.findByText('Routine screen')).toBeOnTheScreen();
});
