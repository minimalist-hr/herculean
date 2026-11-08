import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router, Stack, type Href } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { NotificationBar } from '@/components/notification-bar';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ThemeProvider } from '@/theme/theme-provider';

import { RoutineScreen } from './routine-screen';
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

const id = '0198a000-0000-7000-8000-000000000001';

function routine(weekdays: string[] = ['monday']) {
  return {
    id,
    name: 'Legs',
    weekdays,
    exercises: [
      {
        exerciseId: 'squat',
        name: 'Squat',
        groupId: 'legs',
        groupName: 'Legs',
        targetSets: 3,
        targetRepsFrom: 8,
        targetRepsTo: 10,
      },
      {
        exerciseId: 'lunge',
        name: 'Lunge',
        groupId: 'legs',
        groupName: 'Legs',
        targetSets: 2,
        targetRepsFrom: 6,
        targetRepsTo: 6,
      },
    ],
  };
}

function conflict(code: string, detail: string) {
  return Response.json(
    {
      type: 'about:blank',
      title: 'Conflict',
      status: 409,
      detail,
      code,
      traceId: '00-1',
    },
    { status: 409 },
  );
}

function answer(
  details: unknown,
  {
    remove,
    restore,
  }: { remove?: () => Promise<Response>; restore?: () => Response } = {},
) {
  mockFetch.mockImplementation((request) => {
    if (request.method === 'DELETE') {
      return remove?.() ?? Promise.resolve(new Response(null, { status: 204 }));
    }
    if (request.method === 'POST') {
      return Promise.resolve(
        restore?.() ?? Response.json({ id, name: 'Legs' }),
      );
    }
    return Promise.resolve(
      Response.json(
        new URL(request.url).pathname === '/api/v1/routines' ? [] : details,
      ),
    );
  });
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

async function renderRoutine() {
  await renderRouter(
    {
      _layout: Layout,
      index: () => <PlaceholderScreen title="List screen" />,
      '[id]': () => <RoutineScreen id={id} />,
      'routine/[id]/edit': () => (
        <PlaceholderScreen title="Edit routine page" />
      ),
    },
    { initialUrl: '/' },
  );
}

async function open() {
  await renderRoutine();
  await act(async () => {
    await Promise.resolve();
    router.push(`/${id}` as Href);
  });
}

async function confirmDelete() {
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Delete routine' }),
  );
  const buttons = await screen.findAllByRole('button', {
    name: 'Delete routine',
  });
  await fireEvent.press(buttons[buttons.length - 1]);
}

beforeEach(() => {
  mockFetch.mockReset();
});

test('shows the skeleton, then the routine for display', async () => {
  answer(routine());
  await open();

  expect(await screen.findByLabelText('Loading the routine')).toBeOnTheScreen();
  expect(await screen.findByRole('header', { name: 'Legs' })).toBeOnTheScreen();
  expect(screen.getByText('2 exercises · 5 sets')).toBeOnTheScreen();
  expect(screen.getByText('3 × 8–10')).toBeOnTheScreen();
  expect(screen.queryByText(/· Legs$/)).toBeNull();
  expect(screen.getAllByText('Legs')).toHaveLength(2);
  expect(screen.getByText('2 × 6')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Squat' })).toBeNull();
});

test('its days show, and can only be changed by editing', async () => {
  answer(routine(['monday', 'thursday']));
  await open();

  expect(await screen.findByText('Mon')).toBeOnTheScreen();
  expect(screen.getByText('Thu')).toBeOnTheScreen();
  expect(screen.queryByText('Tue')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Monday' })).toBeNull();
  expect(screen.queryByText('Picking a day replaces its routine')).toBeNull();
});

test('a routine on no days says so', async () => {
  answer(routine([]));
  await open();

  expect(await screen.findByText('Not on any day yet')).toBeOnTheScreen();
});

test('a failed read says so, and Try again reads it again', async () => {
  mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  await open();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't load this routine.",
  );

  answer(routine());
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByRole('header', { name: 'Legs' })).toBeOnTheScreen();
});

test('the edit button opens the edit page', async () => {
  answer(routine());
  await open();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Edit routine' }),
  );

  expect(await screen.findByText('Edit routine page')).toBeOnTheScreen();
});

test.each([
  [
    ['monday'],
    'Monday becomes a rest day in the week plan. Workouts you already logged stay.',
  ],
  [
    ['monday', 'thursday'],
    'Monday and Thursday become rest days in the week plan. Workouts you already logged stay.',
  ],
  [[], "It isn't in your week plan. Workouts you already logged stay."],
])(
  'the delete sheet for days %j says what happens',
  async (weekdays, message) => {
    answer(routine(weekdays));
    await open();

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Delete routine' }),
    );

    expect(await screen.findByText('Delete Legs?')).toBeOnTheScreen();
    expect(screen.getByText(message)).toBeOnTheScreen();
  },
);

test('deleting goes back, and Undo restores it', async () => {
  answer(routine());
  await open();

  await confirmDelete();

  expect(await screen.findByText('Legs deleted.')).toBeOnTheScreen();
  expect(await screen.findByText('List screen')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

  await waitFor(() => {
    expect(
      mockFetch.mock.calls.some(
        ([request]) =>
          request.method === 'POST' &&
          new URL(request.url).pathname === `/api/v1/routines/${id}/restore`,
      ),
    ).toBe(true);
  });
});

test('a failed delete stays on the routine and says so', async () => {
  answer(routine(), {
    remove: () => Promise.reject(new TypeError('Network request failed')),
  });
  await open();

  await confirmDelete();

  expect(
    await screen.findByText("Couldn't delete the routine. Try again."),
  ).toBeOnTheScreen();
  expect(screen.getByRole('header', { name: 'Legs' })).toBeOnTheScreen();
});

test.each([
  ['routine.exercise_deleted', "One of this routine's exercises was deleted."],
  ['routine.name_taken', 'You already have a routine with this name.'],
])('an Undo stopped by %s shows the API message', async (code, detail) => {
  answer(routine(), { restore: () => conflict(code, detail) });
  await open();

  await confirmDelete();
  await screen.findByText('Legs deleted.');
  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

  expect(await screen.findByText(detail)).toBeOnTheScreen();
});

test('any other failed Undo says to try again', async () => {
  answer(routine(), {
    restore: () => Response.json({}, { status: 500 }),
  });
  await open();

  await confirmDelete();
  await screen.findByText('Legs deleted.');
  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

  expect(
    await screen.findByText("Couldn't undo. Try again."),
  ).toBeOnTheScreen();
});
