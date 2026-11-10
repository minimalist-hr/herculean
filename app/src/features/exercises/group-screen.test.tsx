import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import GroupRoute from '@/app/(tabs)/exercises/groups/[id]';
import EditGroupRoute from '@/app/group/[id]/edit';
import { NotificationBar } from '@/components/notification-bar';
import { ThemeProvider } from '@/theme/theme-provider';

import { GroupsScreen } from './groups-screen';
import { createTestQueryClient } from '@/test-utils/query-client';
import { OpenedPage } from '@/test-utils/opened-page';

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

interface StoredGroup {
  id: string;
  name: string;
  exercises: string[];
  alsoWorks: string[];
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

/** Squat is the only exercise that has been done. */
function row(name: string) {
  const bestSet =
    name === 'Squat' ? { weightKg: 100, reps: 5, date: '2023-10-16' } : null;
  return { id: name, name, groupId: 'x', groupName: 'X', bestSet };
}

/** Answers from the stored groups. A write with an override answers with that instead. */
function answer(overrides: Partial<Record<string, () => Response>> = {}) {
  let stored: StoredGroup[] = [
    {
      id: 'chest',
      name: 'Chest',
      exercises: ['Bench press', 'Pec deck'],
      alsoWorks: ['Shoulder press'],
    },
    { id: 'core', name: 'Core', exercises: [], alsoWorks: [] },
    { id: 'legs', name: 'Legs', exercises: ['Squat'], alsoWorks: [] },
  ];
  let deleted: StoredGroup[] = [];

  mockFetch.mockImplementation(async (request) => {
    const { pathname } = new URL(request.url);
    const { method } = request;
    if (pathname === '/api/v1/users/me') {
      return Response.json({
        email: 'filip@example.com',
        name: 'Filip',
        units: 'metric',
        timeZone: 'Europe/Zagreb',
      });
    }

    const override = overrides[method];
    if (override !== undefined) {
      return override();
    }

    const id = pathname.split('/')[4];
    if (method === 'GET' && pathname === '/api/v1/groups') {
      return Response.json(
        stored.map((group) => ({
          id: group.id,
          name: group.name,
          exerciseCount: group.exercises.length + group.alsoWorks.length,
        })),
      );
    }
    if (method === 'GET') {
      const group = stored.find((item) => item.id === id);
      return group === undefined
        ? problem(404, 'group.not_found', 'The group does not exist.')
        : Response.json({
            id: group.id,
            name: group.name,
            exercises: group.exercises.map(row),
            alsoWorksExercises: group.alsoWorks.map(row),
          });
    }
    if (method === 'PATCH') {
      const { name } = (await request.json()) as { name: string };
      stored = stored.map((item) =>
        item.id === id ? { ...item, name } : item,
      );
      return Response.json({ id, name });
    }
    if (method === 'DELETE') {
      deleted = stored.filter((item) => item.id === id);
      stored = stored.filter((item) => item.id !== id);
      return new Response(null, { status: 204 });
    }

    stored = stored.concat(deleted.filter((item) => item.id === id));
    return Response.json({ id, name: 'Core' });
  });
}

function sent(method: string) {
  return mockFetch.mock.calls.filter(([request]) => request.method === method);
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

/** Opens the details the way a user does: the groups, then a row. */
async function openGroup(name: RegExp) {
  await renderRouter(
    {
      _layout: Layout,
      'exercises/groups/index': GroupsScreen,
      'exercises/groups/[id]': GroupRoute,
      'group/[id]/edit': EditGroupRoute,
      'exercises/[id]': OpenedPage,
    },
    { initialUrl: '/exercises/groups' },
  );

  await fireEvent.press(await screen.findByRole('button', { name }));
}

/** A sheet opens over the screen, so its button comes after any with the same name behind it. */
function pressLast(name: string) {
  const buttons = screen.getAllByRole('button', { name });

  return fireEvent.press(buttons[buttons.length - 1]);
}

beforeEach(() => {
  mockFetch.mockReset();
});

test('a row opens the group, with its count and both lists', async () => {
  answer();
  await openGroup(/^Chest/);

  expect(
    await screen.findByRole('header', { name: 'Chest' }),
  ).toBeOnTheScreen();
  expect(screen.getByText('3 exercises')).toBeOnTheScreen();
  expect(screen.getByText('No sessions yet')).toBeOnTheScreen();
  expect(screen.getByText('Exercises')).toBeOnTheScreen();
  expect(screen.getByText('Also works')).toBeOnTheScreen();
  expect(screen.getByText('Bench press')).toBeOnTheScreen();
  expect(screen.getByText('Shoulder press')).toBeOnTheScreen();
});

test('once an exercise is done, its row shows the best set and the card goes', async () => {
  answer();
  await openGroup(/^Legs/);

  expect(
    await screen.findByText('100 kg × 5 · Mon, 16th Oct 2023'),
  ).toBeOnTheScreen();
  expect(screen.queryByText('No sessions yet')).toBeNull();
});

test('an empty group keeps both sections and says how to fill them', async () => {
  answer();
  await openGroup(/^Core/);

  expect(
    await screen.findByText('Choose this group when you create or edit one.'),
  ).toBeOnTheScreen();
  expect(screen.getByText('Also works')).toBeOnTheScreen();
  expect(
    screen.getByText(
      'Choose this group under Also works when you create or edit an exercise.',
    ),
  ).toBeOnTheScreen();
});

test('a failed read says so, and Try again reads it again', async () => {
  answer();
  await openGroup(/^Chest/);
  await screen.findByRole('header', { name: 'Chest' });
  await fireEvent.press(screen.getByRole('link', { name: 'Groups' }));
  await screen.findByRole('button', { name: /^Chest/ });

  const answers = mockFetch.getMockImplementation();
  mockFetch.mockRejectedValue(new TypeError('Network request failed'));
  await fireEvent.press(screen.getByRole('button', { name: /^Core/ }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Couldn’t load this group.',
  );

  mockFetch.mockImplementation(answers);
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByRole('header', { name: 'Core' })).toBeOnTheScreen();
});

test('an exercise row opens the exercise, with the group as its back link', async () => {
  answer();
  await openGroup(/^Chest/);

  await fireEvent.press(
    await screen.findByRole('button', { name: /^Bench press/ }),
  );

  expect(await screen.findByText(/^Opened from group:/)).toBeOnTheScreen();
});

test('the edit button opens Edit group, which saves the name', async () => {
  answer();
  await openGroup(/^Chest/);

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Edit group' }),
  );

  expect(
    await screen.findByRole('header', { name: 'Edit group' }),
  ).toBeOnTheScreen();
  expect(screen.getByDisplayValue('Chest')).toBeOnTheScreen();
  expect(
    screen.getByText('The new name shows on every chip and section.'),
  ).toBeOnTheScreen();
  expect(screen.getByRole('link', { name: 'Chest' })).toBeOnTheScreen();

  await fireEvent.changeText(screen.getByLabelText('Name'), 'Pecs');
  await pressLast('Save group');

  expect(await screen.findByRole('alert')).toHaveTextContent('Pecs saved.');
  expect(await screen.findByRole('header', { name: 'Pecs' })).toBeOnTheScreen();
});

test('the trash on a group in use says why, and deletes nothing', async () => {
  answer();
  await openGroup(/^Chest/);

  await fireEvent.press(
    await screen.findByRole('button', {
      name: 'Delete Chest, not available while it has exercises',
    }),
  );

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Move or delete this group’s exercises first.',
  );
  expect(screen.queryByRole('header', { name: 'Delete Chest?' })).toBeNull();
  expect(sent('DELETE')).toHaveLength(0);
});

test('deleting an empty group asks first, returns to the groups and offers undo', async () => {
  answer();
  await openGroup(/^Core/);

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Delete Core' }),
  );

  expect(
    await screen.findByRole('header', { name: 'Delete Core?' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByText('It has no exercises, so nothing else changes.'),
  ).toBeOnTheScreen();
  expect(sent('DELETE')).toHaveLength(0);

  await pressLast('Delete group');

  expect(await screen.findByRole('alert')).toHaveTextContent(/^Core deleted\./);
  await waitFor(() => {
    expect(screen.queryByRole('header', { name: 'Core' })).toBeNull();
  });
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /^Core/ })).toBeNull();
  });

  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

  expect(
    await screen.findByRole('button', { name: /^Core/ }),
  ).toBeOnTheScreen();
});

test('a failed delete stays on the group and says so', async () => {
  answer({ DELETE: () => problem(500, 'server_error', 'Something failed.') });
  await openGroup(/^Core/);

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Delete Core' }),
  );
  await screen.findByRole('header', { name: 'Delete Core?' });
  await pressLast('Delete group');

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Couldn’t delete the group. Try again.',
  );
  expect(screen.getByRole('header', { name: 'Core' })).toBeOnTheScreen();
});

async function renderEditAlone() {
  await renderRouter(
    { _layout: Layout, 'group/[id]/edit': EditGroupRoute },
    { initialUrl: '/group/chest/edit' },
  );
}

test('while it loads, the form keeps its shape and Save group is muted', async () => {
  mockFetch.mockImplementation(() => new Promise(() => undefined));
  await renderEditAlone();

  expect(screen.getByLabelText('Loading the group')).toBeOnTheScreen();
  expect(
    screen.getByText('The new name shows on every chip and section.'),
  ).toBeOnTheScreen();
  expect(screen.getByText('Name')).toBeOnTheScreen();

  const save = screen.getByRole('button', { name: 'Save group' });
  expect(save).toHaveStyle({ opacity: 0.5 });
  await fireEvent.press(save);
  expect(
    await screen.findByText('This page hasn’t loaded yet.'),
  ).toBeOnTheScreen();
});

test('a failed load keeps Save group, muted', async () => {
  mockFetch.mockRejectedValue(new TypeError('Network request failed'));
  await renderEditAlone();

  expect(
    await screen.findByText('Couldn’t load this group.'),
  ).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Save group' })).toHaveStyle({
    opacity: 0.5,
  });
});
