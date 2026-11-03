import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import NewRoutineLayout from '@/app/routine/new/_layout';
import NewRoutineRoute from '@/app/routine/new/index';

import { NotificationBar } from '@/components/notification-bar';
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
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function renderRoutines() {
  await renderRouter(
    {
      _layout: Layout,
      index: RoutinesScreen,
      'routines/[id]': () => <PlaceholderScreen title="Routine screen" />,
      'routine/new/_layout': NewRoutineLayout,
      'routine/new/index': NewRoutineRoute,
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

test('shows the skeleton, then the week plan and below it the routines', async () => {
  const days = restWeek();
  days[0] = {
    weekday: 'monday',
    routineId: 'legs',
    routineName: 'Legs',
  } as never;
  answer([legs], days);
  await renderRoutines();

  expect(screen.getByLabelText('Loading your routines')).toBeOnTheScreen();

  expect(await screen.findByText('4 exercises · 10 sets')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Loading your routines')).toBeNull();
  expect(screen.getAllByText('Fri')).toHaveLength(2);
  expect(screen.getByText('Repeats every week')).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Monday, Legs' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Tuesday, rest day' }),
  ).toBeOnTheScreen();
});

test('a day with a routine opens it, and a rest day says how to plan it', async () => {
  const days = restWeek();
  days[0] = {
    weekday: 'monday',
    routineId: 'legs',
    routineName: 'Legs',
  } as never;
  answer([legs], days);
  await renderRoutines();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Tuesday, rest day' }),
  );
  expect(
    await screen.findByText(
      'Tuesday is a rest day. Edit a routine to pick its days.',
    ),
  ).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Monday, Legs' }));

  expect(await screen.findByText('Routine screen')).toBeOnTheScreen();
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
  expect(screen.queryByLabelText('Search routines')).toBeNull();
  expect(screen.queryByText('Repeats every week')).toBeNull();
});

test('a failed read says so, and Try again reads both again', async () => {
  mockFetch.mockRejectedValue(new TypeError('Network request failed'));
  await renderRoutines();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't load your routines.",
  );

  answer([legs]);
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('Legs')).toBeOnTheScreen();
});

test('New routine opens the page', async () => {
  answer([]);
  await renderRoutines();

  await fireEvent.press(screen.getByRole('button', { name: 'New routine' }));

  expect(
    await screen.findByRole('header', { name: 'New routine' }),
  ).toBeOnTheScreen();
});

test('a routine opens it', async () => {
  answer([legs]);
  await renderRoutines();

  await fireEvent.press(await screen.findByRole('button', { name: /^Legs/ }));

  expect(await screen.findByText('Routine screen')).toBeOnTheScreen();
});

test('a search narrows the routines by name', async () => {
  answer([legs, { ...legs, id: 'push', name: 'Push', weekdays: [] }]);
  await renderRoutines();
  await screen.findByRole('button', { name: /^Legs/ });

  await fireEvent.changeText(screen.getByLabelText('Search routines'), ' pu ');

  expect(screen.getByRole('button', { name: /^Push/ })).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: /^Legs/ })).toBeNull();
  expect(screen.queryByText('Repeats every week')).toBeNull();
});

test('no matches says so, and New routine starts from the search', async () => {
  answer([legs]);
  await renderRoutines();
  await screen.findByRole('button', { name: /^Legs/ });

  await fireEvent.changeText(screen.getByLabelText('Search routines'), 'Arms');
  expect(screen.getByText('No matches for “Arms”')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'New routine' }));

  expect(await screen.findByLabelText('Name')).toHaveDisplayValue('Arms');
});
