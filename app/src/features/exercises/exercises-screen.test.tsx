import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { FlatList } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ThemeProvider } from '@/theme/theme-provider';

import { ExercisesScreen } from './exercises-screen';

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

const chest = { id: '0198a000-0000-7000-8000-000000000001', name: 'Chest' };
const back = { id: '0198a000-0000-7000-8000-000000000002', name: 'Back' };

function exercise(name: string, group: typeof chest, bestSet: unknown = null) {
  return { id: name, name, groupId: group.id, groupName: group.name, bestSet };
}

function user(units: string) {
  return {
    email: 'filip@example.com',
    name: 'Filip',
    units,
    timeZone: 'Europe/Zagreb',
  };
}

/** Answers every read. The exercises depend on the request's search and group. */
function answer(
  exercises: (query: URLSearchParams) => unknown[],
  units = 'metric',
  groups: unknown[] = [chest, back],
) {
  mockFetch.mockImplementation((request) => {
    const url = new URL(request.url);
    if (url.pathname === '/api/v1/groups') {
      return Promise.resolve(Response.json(groups));
    }
    if (url.pathname === '/api/v1/users/me') {
      return Promise.resolve(Response.json(user(units)));
    }

    return Promise.resolve(Response.json(exercises(url.searchParams)));
  });
}

function exerciseRequests() {
  return mockFetch.mock.calls
    .map(([request]) => new URL(request.url))
    .filter((url) => url.pathname === '/api/v1/exercises');
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

async function renderExercises() {
  await renderRouter(
    {
      _layout: Layout,
      index: ExercisesScreen,
      'exercises/groups': () => <PlaceholderScreen title="Groups screen" />,
      'exercises/[id]': () => <PlaceholderScreen title="Exercise screen" />,
      'exercise/new': () => <PlaceholderScreen title="New exercise page" />,
    },
    { initialUrl: '/' },
  );
}

beforeEach(() => {
  mockFetch.mockReset();
});

test('shows the skeleton, then the exercises under their groups', async () => {
  answer(() => [
    exercise('Bench press', chest),
    exercise('Pec deck', chest),
    exercise('Pull-up', back),
  ]);
  await renderExercises();

  expect(screen.getByLabelText('Loading your exercises')).toBeOnTheScreen();

  expect(await screen.findByText('Bench press')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Loading your exercises')).toBeNull();
  expect(screen.getByText('Pec deck')).toBeOnTheScreen();
  expect(screen.getByText('Pull-up')).toBeOnTheScreen();
  expect(screen.getAllByText('Not done yet')).toHaveLength(3);
  expect(screen.getAllByRole('button', { name: 'New exercise' })).toHaveLength(
    1,
  );
});

test('a row shows the best set in the user’s units', async () => {
  answer(
    () => [
      exercise('Bench press', chest, {
        weightKg: 82.5,
        reps: 10,
        date: '2026-10-16',
      }),
    ],
    'imperial',
  );
  await renderExercises();

  expect(
    await screen.findByText('181.9 lb × 10 · Fri, 16 Oct'),
  ).toBeOnTheScreen();
});

test('search waits for typing to stop and sends the trimmed text', async () => {
  answer((query) =>
    query.get('search') === 'bench'
      ? [exercise('Bench press', chest)]
      : [exercise('Bench press', chest), exercise('Pull-up', back)],
  );
  await renderExercises();
  expect(await screen.findByText('Pull-up')).toBeOnTheScreen();

  await fireEvent.changeText(screen.getByLabelText('Search exercises'), 'b');
  await fireEvent.changeText(
    screen.getByLabelText('Search exercises'),
    ' bench ',
  );

  await waitFor(() => {
    expect(screen.queryByText('Pull-up')).toBeNull();
  });
  expect(
    exerciseRequests().map((url) => url.searchParams.get('search')),
  ).toEqual([null, 'bench']);
});

test('the clear button empties the search and shows the whole list right away', async () => {
  answer((query) =>
    query.has('search')
      ? [exercise('Bench press', chest)]
      : [exercise('Bench press', chest), exercise('Pull-up', back)],
  );
  await renderExercises();
  expect(await screen.findByText('Pull-up')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();

  await fireEvent.changeText(
    screen.getByLabelText('Search exercises'),
    'bench',
  );
  await waitFor(() => {
    expect(screen.queryByText('Pull-up')).toBeNull();
  });

  await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));

  expect(screen.getByLabelText('Search exercises')).toHaveDisplayValue('');
  expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  expect(await screen.findByText('Pull-up')).toBeOnTheScreen();
});

test('a chip narrows the list to its group', async () => {
  answer((query) =>
    query.get('groupId') === back.id
      ? [exercise('Pull-up', back)]
      : [exercise('Bench press', chest), exercise('Pull-up', back)],
  );
  await renderExercises();
  expect(await screen.findByText('Bench press')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));

  await waitFor(() => {
    expect(screen.queryByText('Bench press')).toBeNull();
  });
  expect(
    screen.getByRole('button', { name: 'Back', selected: true }),
  ).toBeOnTheScreen();
});

test('a search without results says so and offers to create the exercise', async () => {
  answer((query) =>
    query.has('search') ? [] : [exercise('Bench press', chest)],
  );
  await renderExercises();
  expect(await screen.findByText('Bench press')).toBeOnTheScreen();

  await fireEvent.changeText(
    screen.getByLabelText('Search exercises'),
    'Hack squat',
  );

  expect(
    await screen.findByText('No matches for “Hack squat”'),
  ).toBeOnTheScreen();
  expect(
    screen.getByText('Check the spelling, or create it as a new exercise.'),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText('Search exercises')).toBeOnTheScreen();

  await fireEvent.press(
    screen.getAllByRole('button', { name: 'New exercise' })[0],
  );
  expect(await screen.findByText('New exercise page')).toBeOnTheScreen();
});

test('picking a group and searching both return the list to the top', async () => {
  answer(() => [exercise('Bench press', chest)]);
  await renderExercises();
  expect(await screen.findByText('Bench press')).toBeOnTheScreen();
  const scrollToOffset = jest.spyOn(FlatList.prototype, 'scrollToOffset');

  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  await waitFor(() => {
    expect(scrollToOffset).toHaveBeenCalledTimes(1);
  });

  await fireEvent.changeText(
    screen.getByLabelText('Search exercises'),
    'bench',
  );
  await waitFor(() => {
    expect(scrollToOffset).toHaveBeenCalledTimes(2);
  });
  expect(scrollToOffset).toHaveBeenLastCalledWith({
    offset: 0,
    animated: false,
  });
  scrollToOffset.mockRestore();
});

test('a group without exercises names the group', async () => {
  answer((query) =>
    query.has('groupId') ? [] : [exercise('Bench press', chest)],
  );
  await renderExercises();
  expect(await screen.findByText('Bench press')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));

  expect(await screen.findByText('No exercises in Back')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'All' })).toBeOnTheScreen();
});

test('no exercises at all shows the empty state, without search or chips', async () => {
  answer(() => []);
  await renderExercises();

  expect(await screen.findByText('No exercises yet')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Search exercises')).toBeNull();
  expect(screen.queryByRole('button', { name: 'All' })).toBeNull();
  expect(screen.getAllByRole('button', { name: 'New exercise' })).toHaveLength(
    1,
  );

  await fireEvent.press(
    screen.getAllByRole('button', { name: 'New exercise' })[0],
  );
  expect(await screen.findByText('New exercise page')).toBeOnTheScreen();
});

test('a failed load says so, and Try again loads the list', async () => {
  mockFetch.mockRejectedValue(new TypeError('Network request failed'));
  await renderExercises();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't load your exercises.",
  );

  answer(() => [exercise('Bench press', chest)]);
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('Bench press')).toBeOnTheScreen();
  expect(screen.queryByRole('alert')).toBeNull();
});

test('a row opens the exercise', async () => {
  answer(() => [exercise('Bench press', chest)]);
  await renderExercises();

  await fireEvent.press(
    await screen.findByRole('button', { name: /Bench press/ }),
  );
  expect(await screen.findByText('Exercise screen')).toBeOnTheScreen();
});

test('the Groups link opens the groups', async () => {
  answer(() => [exercise('Bench press', chest)]);
  await renderExercises();

  await fireEvent.press(await screen.findByRole('link', { name: 'Groups' }));
  expect(await screen.findByText('Groups screen')).toBeOnTheScreen();
});

test('with no groups, New exercise is muted and says why', async () => {
  answer(() => [], 'metric', []);
  await renderExercises();
  expect(await screen.findByText('No exercises yet')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'New exercise' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Create a group first.',
  );
  expect(screen.queryByText('New exercise page')).toBeNull();
});
