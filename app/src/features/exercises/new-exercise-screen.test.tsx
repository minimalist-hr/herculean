import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { renderRouter } from 'expo-router/testing-library';

import NewExerciseRoute from '@/app/exercise/new';

import { NotificationBar } from '@/components/notification-bar';
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
const biceps = { id: '0198a000-0000-7000-8000-000000000003', name: 'Biceps' };

function row(name: string, group: typeof chest) {
  return {
    id: name,
    name,
    groupId: group.id,
    groupName: group.name,
    bestSet: null,
  };
}

function problem(status: number, code: string, detail: string) {
  return Response.json(
    {
      type: 'about:blank',
      title: 'Error',
      status,
      detail,
      code,
      traceId: '00-1',
    },
    { status },
  );
}

let groupList = [chest, back, biceps];

/** Answers reads, and answers saving with this. The list holds what was saved. */
function answer(save: (body: { name: string; groupId: string }) => Response) {
  const exercises = [row('Bench press', chest)];
  mockFetch.mockImplementation(async (request) => {
    const url = new URL(request.url);
    if (request.method === 'POST') {
      const body = (await request.json()) as { name: string; groupId: string };
      const response = save(body);
      if (response.ok) {
        exercises.push(row(body.name, body.groupId === back.id ? back : chest));
      }
      return response;
    }
    if (url.pathname === '/api/v1/groups') {
      return Response.json(groupList);
    }
    if (url.pathname === '/api/v1/users/me') {
      return Response.json({
        email: 'f@example.com',
        name: 'F',
        units: 'metric',
        timeZone: 'Europe/Zagreb',
      });
    }

    const search = url.searchParams.get('search')?.toLowerCase();
    const groupId = url.searchParams.get('groupId');
    return Response.json(
      exercises.filter(
        (exercise) =>
          (search == null || exercise.name.toLowerCase().includes(search)) &&
          (groupId == null || exercise.groupId === groupId),
      ),
    );
  });
}

const created = (body: { name: string; groupId: string }) =>
  Response.json(
    {
      id: 'new',
      name: body.name,
      groupId: body.groupId,
      alsoWorksGroupIds: [],
    },
    { status: 201 },
  );

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

/** The page opens over the list's chips, so its button comes after any with the same name. */
function pressLast(name: string) {
  const buttons = screen.getAllByRole('button', { name });

  return fireEvent.press(buttons[buttons.length - 1]);
}

async function renderList() {
  await renderRouter(
    {
      _layout: Layout,
      '(tabs)/_layout': () => (
        <Tabs tabBar={() => null} screenOptions={{ headerShown: false }}>
          <Tabs.Screen name="exercises" />
        </Tabs>
      ),
      '(tabs)/exercises/_layout': () => (
        <Stack screenOptions={{ headerShown: false }} />
      ),
      '(tabs)/exercises/index': ExercisesScreen,
      'exercise/new': NewExerciseRoute,
    },
    { initialUrl: '/exercises' },
  );
  expect(await screen.findByText('Bench press')).toBeOnTheScreen();
}

async function openForm() {
  await fireEvent.press(screen.getByRole('button', { name: 'New exercise' }));
  expect(await screen.findByText('Save exercise')).toBeOnTheScreen();
  expect(
    (await screen.findAllByRole('button', { name: 'Chest' }))[0],
  ).toBeOnTheScreen();
}

async function save() {
  await fireEvent.press(screen.getByRole('button', { name: 'Save exercise' }));
}

function savedBody() {
  const call = mockFetch.mock.calls.find(
    ([request]) => request.method === 'POST',
  );
  return call?.[0].clone();
}

beforeEach(() => {
  mockFetch.mockReset();
  groupList = [chest, back, biceps];
});

test('saving creates the exercise, returns to the list and says so', async () => {
  const bodies: unknown[] = [];
  answer((body) => {
    bodies.push(body);
    return created(body);
  });
  await renderList();
  await openForm();

  await fireEvent.changeText(screen.getByLabelText('Name'), '  Pull-up ');
  await pressLast('Back');
  await pressLast('Biceps, also works');
  await save();

  expect(await screen.findByText('Pull-up created.')).toBeOnTheScreen();
  expect(await screen.findByText('Pull-up')).toBeOnTheScreen();
  expect(bodies).toEqual([
    { name: 'Pull-up', groupId: back.id, alsoWorksGroupIds: [biceps.id] },
  ]);
});

test('the green line clears when the search or a group changes', async () => {
  answer(created);
  await renderList();
  await openForm();
  await fireEvent.changeText(screen.getByLabelText('Name'), 'Pull-up');
  await pressLast('Back');
  await save();
  expect(await screen.findByText('Pull-up created.')).toBeOnTheScreen();

  await pressLast('Back');

  await waitFor(() => {
    expect(screen.queryByText('Pull-up created.')).toBeNull();
  });
});

test('after saving, a filter that would hide the new exercise is cleared', async () => {
  answer(created);
  await renderList();
  await pressLast('Back');
  await waitFor(() => {
    expect(screen.queryByText('Bench press')).toBeNull();
  });
  await openForm();

  await fireEvent.changeText(screen.getByLabelText('Name'), 'Pec deck');
  await pressLast('Chest');
  await save();

  expect(await screen.findByText('Pec deck')).toBeOnTheScreen();
  expect(screen.getByText('Bench press')).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'All', selected: true }),
  ).toBeOnTheScreen();
});

test('the form brings over the search and the group from the list', async () => {
  answer(created);
  await renderList();
  await pressLast('Back');
  await fireEvent.changeText(
    screen.getByLabelText('Search exercises'),
    ' Hack squat ',
  );
  expect(
    await screen.findByText('No matches for “Hack squat”'),
  ).toBeOnTheScreen();

  await openForm();

  expect(screen.getByLabelText('Name')).toHaveDisplayValue('Hack squat');
  expect(
    screen.getByRole('button', { name: 'Back', selected: true }),
  ).toBeOnTheScreen();
});

test('without a group the form asks for one and sends nothing', async () => {
  answer(created);
  await renderList();
  await openForm();

  await save();

  expect(await screen.findByText('Enter a name.')).toBeOnTheScreen();
  expect(screen.getByText('Choose a group.')).toBeOnTheScreen();
  expect(savedBody()).toBeUndefined();
});

test('the group an exercise belongs to is not offered as also works', async () => {
  answer(created);
  await renderList();
  await openForm();
  await pressLast('Biceps, also works');
  expect(
    screen.getByRole('button', { name: 'Biceps, also works', selected: true }),
  ).toBeOnTheScreen();

  await pressLast('Biceps');

  expect(
    screen.queryByRole('button', { name: 'Biceps, also works' }),
  ).toBeNull();

  await pressLast('Chest');

  expect(
    screen.getByRole('button', { name: 'Biceps, also works', selected: false }),
  ).toBeOnTheScreen();
});

test('a name the user already has shows under the name', async () => {
  answer(() =>
    problem(
      409,
      'exercise.name_taken',
      'You already have an exercise with this name.',
    ),
  );
  await renderList();
  await openForm();
  await fireEvent.changeText(screen.getByLabelText('Name'), 'bench press');
  await pressLast('Chest');

  await save();

  expect(
    await screen.findByText('You already have an exercise with this name.'),
  ).toBeOnTheScreen();
  await waitFor(() => {
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

test('reaching the limit shows the API message', async () => {
  answer(() =>
    problem(
      409,
      'exercise.limit_reached',
      'You’ve reached the limit of 500 exercises.',
    ),
  );
  await renderList();
  await openForm();
  await fireEvent.changeText(screen.getByLabelText('Name'), 'Pull-up');
  await pressLast('Back');

  await save();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'You’ve reached the limit of 500 exercises.',
  );
});

test('no connection shows a notification until a field changes', async () => {
  answer(() => {
    throw new TypeError('Network request failed');
  });
  await renderList();
  await openForm();
  await fireEvent.changeText(screen.getByLabelText('Name'), 'Pull-up');
  await pressLast('Back');

  await save();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't save the exercise. Try again.",
  );

  await fireEvent.changeText(screen.getByLabelText('Name'), 'Pull-ups');

  await waitFor(() => {
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

test('Done on the keyboard saves nothing', async () => {
  answer(created);
  await renderList();
  await openForm();
  await fireEvent.changeText(screen.getByLabelText('Name'), 'Pull-up');
  await pressLast('Back');

  await fireEvent(screen.getByLabelText('Name'), 'submitEditing');

  expect(savedBody()).toBeUndefined();
  expect(
    screen.getByRole('header', { name: 'New exercise' }),
  ).toBeOnTheScreen();
});

test('the back link returns to the list without saving or a message', async () => {
  answer(created);
  await renderList();
  await openForm();

  await fireEvent.press(screen.getByRole('link', { name: 'Exercises' }));

  await waitFor(() => {
    expect(screen.queryByRole('header', { name: 'New exercise' })).toBeNull();
  });
  expect(screen.getByText('Bench press')).toBeOnTheScreen();
  await waitFor(() => {
    expect(screen.queryByRole('alert')).toBeNull();
  });
  expect(savedBody()).toBeUndefined();
});

test('with one group, Also works says to create another', async () => {
  groupList = [chest];
  answer(created);
  await renderList();
  await fireEvent.press(screen.getByRole('button', { name: 'New exercise' }));
  await screen.findByRole('header', { name: 'New exercise' });
  await screen.findAllByRole('button', { name: 'Chest' });

  expect(screen.getByText(/Also works/)).toBeOnTheScreen();
  expect(
    screen.getByText('Create another group to choose it here.'),
  ).toBeOnTheScreen();
});
