import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { FlatList } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ThemeProvider } from '@/theme/theme-provider';

import { ExercisesScreen } from './exercises-screen';
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
    <QueryClientProvider client={createTestQueryClient()}>
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
        date: '2023-10-16',
      }),
    ],
    'imperial',
  );
  await renderExercises();

  expect(
    await screen.findByText('181.9 lb × 10 · Mon, 16th Oct 2023'),
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

test('no exercises keeps the search and chips, muted, and they say why', async () => {
  answer(() => []);
  await renderExercises();

  expect(await screen.findByText('No exercises yet')).toBeOnTheScreen();
  const search = screen.getByRole('button', { name: 'Search exercises' });
  expect(search).toHaveStyle({ opacity: 0.5 });
  await fireEvent.press(search);
  expect(
    await screen.findByText('Create an exercise first.'),
  ).toBeOnTheScreen();

  const chip = await screen.findByRole('button', { name: 'Chest' });
  expect(chip).toHaveStyle({ opacity: 0.5 });
  expect(screen.getByRole('button', { name: 'All' })).toHaveStyle({
    opacity: 0.5,
  });
  await fireEvent.press(chip);
  expect(screen.getByText('No exercises yet')).toBeOnTheScreen();
  expect(exerciseRequests()).toHaveLength(1);
});

test('no exercises still opens New exercise', async () => {
  answer(() => []);
  await renderExercises();

  expect(await screen.findByText('No exercises yet')).toBeOnTheScreen();
  expect(screen.getAllByRole('button', { name: 'New exercise' })).toHaveLength(
    1,
  );

  await fireEvent.press(
    screen.getAllByRole('button', { name: 'New exercise' })[0],
  );
  expect(await screen.findByText('New exercise page')).toBeOnTheScreen();
});

function failing(path: string, then: () => void) {
  then();
  const answered = mockFetch.getMockImplementation();
  if (answered === undefined) {
    throw new Error('Answer before making one path fail.');
  }
  mockFetch.mockImplementation((request) =>
    new URL(request.url).pathname === path
      ? Promise.reject(new TypeError('Network request failed'))
      : answered(request),
  );
}

test('if only the groups fail, the list stays and the chips say so', async () => {
  const exercises = () => {
    answer(() => [exercise('Bench press', chest)]);
  };
  failing('/api/v1/groups', exercises);
  await renderExercises();

  expect(await screen.findByText('Bench press')).toBeOnTheScreen();
  expect(
    await screen.findByText('Couldn’t load your groups.'),
  ).toBeOnTheScreen();
  expect(screen.getByRole('link', { name: 'Groups' })).toBeOnTheScreen();

  exercises();
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(
    await screen.findByRole('button', { name: 'Chest' }),
  ).toBeOnTheScreen();
  expect(screen.queryByText('Couldn’t load your groups.')).toBeNull();
});

test('if only the exercises fail, the chips stay', async () => {
  failing('/api/v1/exercises', () => {
    answer(() => []);
  });
  await renderExercises();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Couldn’t load your exercises.',
  );
  expect(
    await screen.findByRole('button', { name: 'Chest' }),
  ).toBeOnTheScreen();
});

test('a failed load says so, and Try again loads the list', async () => {
  failing('/api/v1/exercises', () => {
    answer(() => []);
  });
  await renderExercises();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Couldn’t load your exercises.',
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

test('with no groups, the search and chips say to create a group', async () => {
  answer(() => [], 'metric', []);
  await renderExercises();

  await fireEvent.press(await screen.findByRole('button', { name: 'All' }));
  expect(await screen.findByText('Create a group first.')).toBeOnTheScreen();

  await fireEvent.press(
    screen.getByRole('button', { name: 'Search exercises' }),
  );
  expect(await screen.findByText('Create a group first.')).toBeOnTheScreen();
});
