import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { NotificationBar } from '@/components/notification-bar';
import { dragBy } from '@/test-utils/drag';
import { createTestQueryClient } from '@/test-utils/query-client';
import { ThemeProvider } from '@/theme/theme-provider';

import { ReorderGroupsScreen } from './reorder-groups-screen';

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

let stored: StoredGroup[];

/** Reads the stored groups, and a new order replaces them unless it fails. */
function answer({ failOrder = false } = {}) {
  stored = [
    { id: 'chest', name: 'Chest', exerciseCount: 7 },
    { id: 'back', name: 'Back', exerciseCount: 1 },
    { id: 'core', name: 'Core', exerciseCount: 0 },
  ];

  mockFetch.mockImplementation(async (request) => {
    if (request.method === 'GET') {
      return Response.json(stored);
    }
    if (failOrder) {
      return Response.json(
        { title: 'Error', status: 500, code: 'server_error', traceId: '00-1' },
        { status: 500 },
      );
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
      <ThemeProvider theme="dark">
        <Stack screenOptions={{ headerShown: false }} />
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function renderGroups() {
  await renderRouter({ _layout: Layout, index: ReorderGroupsScreen });
  await screen.findByRole('button', { name: 'Move Chest' });
}

function groupNames() {
  return screen
    .getAllByRole('button', { name: /^Move / })
    .map((button) => button.props.accessibilityLabel as string);
}

beforeEach(() => {
  mockFetch.mockReset();
});

test('shows the skeleton, then the groups with their counts and handles', async () => {
  answer();
  await renderRouter({ _layout: Layout, index: ReorderGroupsScreen });

  expect(screen.getByLabelText('Loading groups')).toBeOnTheScreen();

  expect(await screen.findByText('7 exercises')).toBeOnTheScreen();
  expect(groupNames()).toEqual(['Move Chest', 'Move Back', 'Move Core']);
});

test('a failed read says so, and Try again reads it again', async () => {
  mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  await renderRouter({ _layout: Layout, index: ReorderGroupsScreen });

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Couldn’t load your groups.',
  );

  answer();
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('7 exercises')).toBeOnTheScreen();
});

test('dragging a handle down a place saves the new order', async () => {
  answer();
  await renderGroups();

  await dragBy(screen.getByRole('button', { name: 'Move Chest' }), 70);

  await waitFor(() => {
    expect(groupNames()).toEqual(['Move Back', 'Move Chest', 'Move Core']);
  });
  await waitFor(() => {
    expect(stored.map((group) => group.id)).toEqual(['back', 'chest', 'core']);
  });
});

test('dragging a handle up past the top stops at the first place', async () => {
  answer();
  await renderGroups();

  await dragBy(screen.getByRole('button', { name: 'Move Core' }), -1000);

  await waitFor(() => {
    expect(groupNames()).toEqual(['Move Core', 'Move Chest', 'Move Back']);
  });
});

test('a drag that ends in the same place saves nothing', async () => {
  answer();
  await renderGroups();

  await dragBy(screen.getByRole('button', { name: 'Move Back' }), 10);

  expect(groupNames()).toEqual(['Move Chest', 'Move Back', 'Move Core']);
  expect(sent('PUT')).toHaveLength(0);
});

test('moving a group saves the new order', async () => {
  answer();
  await renderGroups();

  await fireEvent(
    screen.getByRole('button', { name: 'Move Chest' }),
    'accessibilityAction',
    { nativeEvent: { actionName: 'moveDown' } },
  );

  await waitFor(() => {
    expect(groupNames()).toEqual(['Move Back', 'Move Chest', 'Move Core']);
  });
  await waitFor(() => {
    expect(stored.map((group) => group.id)).toEqual(['back', 'chest', 'core']);
  });
});

test('a failed move says so and goes back', async () => {
  answer({ failOrder: true });
  await renderGroups();

  await fireEvent(
    screen.getByRole('button', { name: 'Move Chest' }),
    'accessibilityAction',
    { nativeEvent: { actionName: 'moveDown' } },
  );

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Couldn’t save the order. Try again.',
  );
  await waitFor(() => {
    expect(groupNames()).toEqual(['Move Chest', 'Move Back', 'Move Core']);
  });
});
