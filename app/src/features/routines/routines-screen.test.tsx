import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import NewRoutineLayout from '@/app/routine/new/_layout';
import NewRoutineRoute from '@/app/routine/new/index';

import { NotificationBar } from '@/components/notification-bar';
import { PlaceholderScreen } from '@/test-utils/placeholder-screen';
import { ThemeProvider } from '@/theme/theme-provider';

import { RoutinesScreen } from './routines-screen';
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
    <QueryClientProvider client={createTestQueryClient()}>
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

test('without routines it says what to do, above seven rest days', async () => {
  answer([]);
  await renderRoutines();

  expect(await screen.findByText('No routines yet')).toBeOnTheScreen();
  expect(
    screen.getByText('Create a routine and pick the days you train.'),
  ).toBeOnTheScreen();
  expect(screen.getByText('Repeats every week')).toBeOnTheScreen();
  expect(
    await screen.findAllByRole('button', { name: /, rest day$/ }),
  ).toHaveLength(7);
});

test('without routines the search is muted and says why', async () => {
  answer([]);
  await renderRoutines();
  await screen.findByText('No routines yet');

  const search = screen.getByRole('button', { name: 'Search routines' });
  expect(search).toHaveStyle({ opacity: 0.5 });
  await fireEvent.press(search);

  expect(await screen.findByText('Create a routine first.')).toBeOnTheScreen();
});

test('without routines a rest day opens New routine with that day picked', async () => {
  answer([]);
  await renderRoutines();
  await screen.findByText('No routines yet');

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Tuesday, rest day' }),
  );

  expect(
    await screen.findByRole('header', { name: 'New routine' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Tuesday', selected: true }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Monday', selected: false }),
  ).toBeOnTheScreen();
});

function failOn(failing: string, routines: unknown[]) {
  mockFetch.mockImplementation((request) => {
    const path = new URL(request.url).pathname;
    if (path === failing) {
      return Promise.reject(new TypeError('Network request failed'));
    }
    return Promise.resolve(
      Response.json(path === '/api/v1/routines' ? routines : restWeek()),
    );
  });
}

test('failed routines say so in their place, and Try again reads them again', async () => {
  failOn('/api/v1/routines', [legs]);
  await renderRoutines();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Couldn’t load your routines.',
  );
  expect(screen.getByText('Week plan')).toBeOnTheScreen();

  answer([legs]);
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('Legs')).toBeOnTheScreen();
});

test('a failed week plan says so in its place, and the routines still show', async () => {
  failOn('/api/v1/week-plan-days', [legs]);
  await renderRoutines();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Couldn’t load the week plan.',
  );
  expect(screen.getByText('Legs')).toBeOnTheScreen();

  answer([legs]);
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(
    await screen.findByRole('button', { name: 'Monday, rest day' }),
  ).toBeOnTheScreen();
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
