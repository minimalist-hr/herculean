import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { NotificationBar } from '@/components/notification-bar';
import { ThemeProvider } from '@/theme/theme-provider';

import NewGroupRoute from '@/app/group/new';

import { GroupsScreen } from './groups-screen';
import { ReorderGroupsScreen } from './reorder-groups-screen';
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

interface StoredGroup {
  id: string;
  name: string;
  exerciseCount: number;
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

let stored: StoredGroup[];
let deleted: StoredGroup[];

/** Answers from the stored groups. A write with an override answers with that instead. */
function answer(overrides: Partial<Record<string, () => Response>> = {}): void {
  stored = [
    { id: 'chest', name: 'Chest', exerciseCount: 7 },
    { id: 'back', name: 'Back', exerciseCount: 1 },
    { id: 'core', name: 'Core', exerciseCount: 0 },
  ];
  deleted = [];

  mockFetch.mockImplementation(async (request) => {
    const { pathname } = new URL(request.url);
    const { method } = request;
    if (method === 'GET') {
      return Response.json(stored);
    }

    const override = overrides[method];
    if (override !== undefined) {
      return override();
    }

    const id = pathname.split('/')[4];
    if (method === 'POST' && pathname.endsWith('/restore')) {
      const group = deleted.find((item) => item.id === id);
      stored = stored.concat(group === undefined ? [] : [group]);
      return Response.json(group);
    }
    if (method === 'POST') {
      const { name } = (await request.json()) as { name: string };
      const group = { id: 'new', name, exerciseCount: 0 };
      stored = [...stored, group];
      return Response.json({ id: group.id, name }, { status: 201 });
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

    const { groupIds } = (await request.json()) as { groupIds: string[] };
    const byId = new Map(stored.map((item) => [item.id, item]));
    stored = groupIds.flatMap((item) => byId.get(item) ?? []);
    return new Response(null, { status: 204 });
  });
}

function sent(method: string) {
  return mockFetch.mock.calls.filter(([request]) => request.method === method);
}

function Layout() {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <ThemeProvider theme="default">
        <Stack screenOptions={{ headerShown: false }} />
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function renderGroups() {
  await renderRouter({
    _layout: Layout,
    index: GroupsScreen,
    'group/new': NewGroupRoute,
    'exercises/groups/reorder': ReorderGroupsScreen,
  });
  await screen.findByRole('button', { name: /^Chest/ });
}

/** A page opens over the screen, so its button comes after any with the same name behind it. */
function pressLast(name: string) {
  const buttons = screen.getAllByRole('button', { name });

  return fireEvent.press(buttons[buttons.length - 1]);
}

function groupNames() {
  return screen
    .getAllByRole('button', { name: /exercises?$/ })
    .map((button) => button.props.accessibilityLabel as string);
}

beforeEach(() => {
  mockFetch.mockReset();
});

test('shows the skeleton, then the groups with their counts', async () => {
  answer();
  await renderRouter({ _layout: Layout, index: GroupsScreen });

  expect(screen.getByLabelText('Loading groups')).toBeOnTheScreen();

  expect(await screen.findByText('7 exercises')).toBeOnTheScreen();
  expect(screen.getByText('1 exercise')).toBeOnTheScreen();
  expect(screen.getByText('0 exercises')).toBeOnTheScreen();
  expect(groupNames()).toEqual([
    'Chest, 7 exercises',
    'Back, 1 exercise',
    'Core, 0 exercises',
  ]);
});

test('a failed read says so, and Try again reads it again', async () => {
  mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  await renderRouter({ _layout: Layout, index: GroupsScreen });

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Couldn’t load your groups.',
  );

  answer();
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('7 exercises')).toBeOnTheScreen();
});

test('New group adds it and says so', async () => {
  answer();
  await renderGroups();

  await fireEvent.press(screen.getByRole('button', { name: 'New group' }));
  await fireEvent.changeText(await screen.findByLabelText('Name'), '  Glutes ');
  await pressLast('Save group');

  expect(await screen.findByRole('alert')).toHaveTextContent('Glutes created.');
  expect(
    await screen.findByRole('button', { name: /^Glutes/ }),
  ).toBeOnTheScreen();
});

test('a blank name is stopped before anything is sent', async () => {
  answer();
  await renderGroups();

  await fireEvent.press(screen.getByRole('button', { name: 'New group' }));
  await pressLast('Save group');

  expect(await screen.findByText('Enter a name.')).toBeOnTheScreen();
  expect(sent('POST')).toHaveLength(0);
});

test('a name another group has shows under Name and the page stays', async () => {
  answer({
    POST: () =>
      problem(
        409,
        'group.name_taken',
        'You already have a group with this name.',
      ),
  });
  await renderGroups();

  await fireEvent.press(screen.getByRole('button', { name: 'New group' }));
  await fireEvent.changeText(await screen.findByLabelText('Name'), 'chest');
  await pressLast('Save group');

  expect(
    await screen.findByText('You already have a group with this name.'),
  ).toBeOnTheScreen();
  expect(screen.getByRole('header', { name: 'New group' })).toBeOnTheScreen();
});

test('a search narrows the list', async () => {
  answer();
  await renderGroups();

  await fireEvent.changeText(screen.getByLabelText('Search groups'), ' che ');

  expect(screen.getByRole('button', { name: /^Chest/ })).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: /^Back/ })).toBeNull();
});

test('the list has no handles, and Reorder opens the reorder page', async () => {
  answer();
  await renderGroups();
  expect(screen.queryByRole('button', { name: /^Move / })).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Reorder groups' }));

  expect(
    await screen.findByRole('header', { name: 'Reorder groups' }),
  ).toBeOnTheScreen();
  expect(
    await screen.findByRole('button', { name: 'Move Chest' }),
  ).toBeOnTheScreen();
});

test('with one group, Reorder is muted and says why', async () => {
  answer();
  stored = stored.slice(0, 1);
  await renderGroups();

  await fireEvent.press(
    screen.getByRole('button', { name: 'Reorder groups, not available yet' }),
  );

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Create another group first.',
  );
});

test('while loading, Reorder is muted and says why', async () => {
  mockFetch.mockImplementation(() => new Promise(() => undefined));
  await renderRouter({ _layout: Layout, index: GroupsScreen });

  await fireEvent.press(
    screen.getByRole('button', { name: 'Reorder groups, not available yet' }),
  );

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'This page hasn’t loaded yet.',
  );
});

test('no matches says so, and New group starts from the search', async () => {
  answer();
  await renderGroups();

  await fireEvent.changeText(screen.getByLabelText('Search groups'), 'Glutes');
  expect(screen.getByText('No matches for “Glutes”')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'New group' }));

  expect(await screen.findByLabelText('Name')).toHaveDisplayValue('Glutes');
});

test('Done on the keyboard saves nothing', async () => {
  answer();
  await renderGroups();

  await fireEvent.press(screen.getByRole('button', { name: 'New group' }));
  await fireEvent.changeText(await screen.findByLabelText('Name'), 'Glutes');
  await fireEvent(screen.getByLabelText('Name'), 'submitEditing');

  expect(sent('POST')).toHaveLength(0);
  expect(screen.getByRole('header', { name: 'New group' })).toBeOnTheScreen();
});

test('leaving the page clears its failure', async () => {
  answer({ POST: () => problem(500, 'server_error', 'Something failed.') });
  await renderGroups();

  await fireEvent.press(screen.getByRole('button', { name: 'New group' }));
  await fireEvent.changeText(await screen.findByLabelText('Name'), 'Glutes');
  await pressLast('Save group');
  await screen.findByRole('alert');

  await fireEvent.press(screen.getByRole('link', { name: 'Groups' }));
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Discard changes' }),
  );

  await waitFor(() => {
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

test('another failure keeps the page and says so', async () => {
  answer({ POST: () => problem(500, 'server_error', 'Something failed.') });
  await renderGroups();

  await fireEvent.press(screen.getByRole('button', { name: 'New group' }));
  await fireEvent.changeText(await screen.findByLabelText('Name'), 'Glutes');
  await pressLast('Save group');

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Couldn’t save the group. Try again.',
  );
  expect(screen.getByRole('header', { name: 'New group' })).toBeOnTheScreen();
  expect(screen.getByDisplayValue('Glutes')).toBeOnTheScreen();
});

test('with no groups, it says so and the search is muted and says why', async () => {
  answer();
  stored = [];
  await renderRouter({ _layout: Layout, index: GroupsScreen });

  expect(await screen.findByText('No groups yet')).toBeOnTheScreen();
  const search = screen.getByRole('button', { name: 'Search groups' });
  expect(search).toHaveStyle({ opacity: 0.5 });
  await fireEvent.press(search);
  expect(await screen.findByText('Create a group first.')).toBeOnTheScreen();
  expect(screen.queryByText(/^No matches/)).toBeNull();

  await fireEvent.press(
    screen.getByRole('button', { name: 'Reorder groups, not available yet' }),
  );
  expect(await screen.findAllByText('Create a group first.')).not.toHaveLength(
    0,
  );
});
