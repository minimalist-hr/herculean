import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState } from 'react';

import { NotificationBar } from '@/components/notification-bar';
import { dismissNotification } from '@/components/notifications';
import { createTestQueryClient } from '@/test-utils/query-client';
import { ThemeProvider } from '@/theme/theme-provider';

import { AdminSettingsScreen } from './admin-settings-screen';
import {
  StarterExerciseScreen,
  StarterGroupScreen,
} from './starter-details-screen';
import {
  EditStarterExerciseScreen,
  NewStarterExerciseScreen,
  StarterExercisesScreen,
} from './starter-exercises-screen';
import {
  EditStarterGroupScreen,
  NewStarterGroupScreen,
  StarterGroupsScreen,
} from './starter-groups-screen';

const mockFetch = jest.fn<Promise<Response>, [Request]>();

jest.mock('@/api/client', () => {
  const createClient =
    jest.requireActual<typeof import('openapi-fetch')>('openapi-fetch').default;
  return {
    api: createClient({
      baseUrl: 'http://api.test',
      fetch: (request: Request) => mockFetch(request),
    }),
    refreshTokens: () => Promise.resolve(true),
  };
});

const chest = { id: 'chest', name: 'Chest', exerciseCount: 1 };
const triceps = { id: 'triceps', name: 'Triceps', exerciseCount: 1 };
const legs = { id: 'legs', name: 'Legs', exerciseCount: 0 };

const benchPress = {
  id: 'bench',
  name: 'Flat barbell bench press',
  groupId: 'chest',
  alsoWorksGroupIds: ['triceps'],
};
const pushdown = {
  id: 'pushdown',
  name: 'Rope pushdown',
  groupId: 'triceps',
  alsoWorksGroupIds: [],
};

const groupsPath = '/api/v1/admin/starter-groups';
const exercisesPath = '/api/v1/admin/starter-exercises';

interface Answers {
  groups?: object[];
  exercises?: object[];
  exercisesStatus?: number;
  saveStatus?: number;
  saveBody?: object;
}

function answerWith(answers: Answers = {}) {
  mockFetch.mockImplementation((request) => {
    const { pathname } = new URL(request.url);
    if (request.method === 'GET') {
      switch (pathname) {
        case groupsPath:
          return Promise.resolve(
            Response.json(answers.groups ?? [chest, triceps, legs]),
          );
        case exercisesPath:
          return Promise.resolve(
            (answers.exercisesStatus ?? 200) === 200
              ? Response.json(answers.exercises ?? [benchPress, pushdown])
              : new Response(null, { status: answers.exercisesStatus }),
          );
        case '/api/v1/admin/health':
          return Promise.resolve(
            Response.json({
              checkedAtUtc: new Date().toISOString(),
              services: [],
            }),
          );
        case '/api/v1/users/me':
          return Promise.resolve(
            Response.json({
              email: 'admin@minimalist.hr',
              name: null,
              units: 'metric',
              theme: 'dark',
              color: 'flux',
              timeZone: 'Etc/UTC',
              role: 'admin',
            }),
          );
        default:
          return Promise.resolve(Response.json([]));
      }
    }

    const status =
      answers.saveStatus ?? (request.method === 'POST' ? 200 : 204);
    return Promise.resolve(
      status === 204
        ? new Response(null, { status })
        : Response.json(answers.saveBody ?? { id: 'new' }, { status }),
    );
  });
}

function sent(method: string, path: string) {
  return mockFetch.mock.calls
    .map(([request]) => request)
    .filter(
      (request) =>
        request.method === method && new URL(request.url).pathname === path,
    );
}

function Layout() {
  const [client] = useState(() => createTestQueryClient());

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider theme="dark">
        <Stack screenOptions={{ headerShown: false }} />
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function renderAt(initialUrl: string) {
  await renderRouter(
    {
      _layout: Layout,
      'admin/settings/index': AdminSettingsScreen,
      'admin/settings/starter/index': StarterExercisesScreen,
      'admin/settings/starter/new': NewStarterExerciseScreen,
      'admin/settings/starter/[id]': StarterExerciseScreen,
      'admin/settings/starter/edit/[id]': EditStarterExerciseScreen,
      'admin/settings/starter/groups/index': StarterGroupsScreen,
      'admin/settings/starter/groups/new': NewStarterGroupScreen,
      'admin/settings/starter/groups/[id]': StarterGroupScreen,
      'admin/settings/starter/groups/edit/[id]': EditStarterGroupScreen,
    },
    { initialUrl },
  );
}

beforeEach(() => {
  mockFetch.mockReset();
});

/** Clears a notification inside act, so it doesn't change the screen after the test. */
async function clearNotification() {
  await act(() => {
    dismissNotification();
  });
}

describe('Starter exercises', () => {
  test('Settings shows how many there are and opens them by group', async () => {
    answerWith();
    await renderAt('/admin/settings');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Starter exercises, 2' }),
    );

    expect(
      await screen.findByText('Flat barbell bench press'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Also Triceps')).toBeOnTheScreen();
    expect(screen.getByText('Rope pushdown')).toBeOnTheScreen();
  });

  test('a group chip and search narrow the list', async () => {
    answerWith();
    await renderAt('/admin/settings/starter');
    await screen.findByText('Rope pushdown');

    await fireEvent.press(screen.getByRole('button', { name: 'Triceps' }));
    expect(screen.queryByText('Flat barbell bench press')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'All' }));
    await fireEvent.changeText(
      screen.getByLabelText('Search starter exercises'),
      'squat',
    );
    expect(await screen.findByText('No matches for “squat”')).toBeOnTheScreen();
  });

  test('with none, a dashed box says so and the chips say why', async () => {
    answerWith({ exercises: [] });
    await renderAt('/admin/settings/starter');

    expect(
      await screen.findByText('New accounts start with none.'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Chest' }));
    expect(
      await screen.findByText('Create a starter exercise first.'),
    ).toBeOnTheScreen();
    await clearNotification();
  });

  test('with no groups, New says to create a group first', async () => {
    answerWith({ groups: [], exercises: [] });
    await renderAt('/admin/settings/starter');
    await screen.findByText('New accounts start with none.');

    await fireEvent.press(
      screen.getByRole('button', { name: 'New starter exercise' }),
    );

    expect(await screen.findByText('Create a group first.')).toBeOnTheScreen();
    await clearNotification();
  });

  test('details that fail to load say so', async () => {
    answerWith({ exercisesStatus: 500 });
    await renderAt('/admin/settings/starter/bench');

    expect(
      await screen.findByText('Couldn’t load starter exercises.'),
    ).toBeOnTheScreen();
  });

  test('a failed list says so', async () => {
    answerWith({ exercisesStatus: 500 });
    await renderAt('/admin/settings/starter');

    expect(
      await screen.findByText('Couldn’t load starter exercises.'),
    ).toBeOnTheScreen();
  });

  test('a new exercise is saved with its groups', async () => {
    answerWith();
    await renderAt('/admin/settings/starter');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'New starter exercise' }),
    );
    await fireEvent.changeText(
      await screen.findByLabelText('Name'),
      'Barbell squat',
    );
    await fireEvent.press(await screen.findByRole('button', { name: 'Legs' }));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Chest, also works' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Save exercise' }),
    );

    expect(await screen.findByText('Barbell squat created.')).toBeOnTheScreen();
    await expect(
      sent('POST', exercisesPath)[0].clone().json(),
    ).resolves.toEqual({
      name: 'Barbell squat',
      groupId: 'legs',
      alsoWorksGroupIds: ['chest'],
    });
    await clearNotification();
  });

  test('a taken name shows under Name', async () => {
    answerWith({
      saveStatus: 409,
      saveBody: {
        type: 'about:blank',
        title: 'Conflict',
        status: 409,
        code: 'starter_exercise.name_taken',
        detail: 'You already have a starter exercise with this name.',
        traceId: '1',
      },
    });
    await renderAt('/admin/settings/starter/new?groupId=chest');

    await fireEvent.changeText(
      await screen.findByLabelText('Name'),
      'Rope pushdown',
    );
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Save exercise' }),
    );

    expect(
      await screen.findByText(
        'You already have a starter exercise with this name.',
      ),
    ).toBeOnTheScreen();
  });

  test('an exercise opens its details, with its groups', async () => {
    answerWith();
    await renderAt('/admin/settings/starter');

    await fireEvent.press(
      await screen.findByRole('button', { name: /^Flat barbell bench press/ }),
    );

    expect(
      await screen.findByRole('button', { name: 'Edit starter exercise' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Chest')).toBeOnTheScreen();
    expect(screen.getByText('Triceps')).toBeOnTheScreen();
    expect(
      screen.getByRole('link', { name: 'Starter exercises' }),
    ).toBeOnTheScreen();
  });

  test('Edit on the details opens the form, which saves and returns', async () => {
    answerWith();
    await renderAt('/admin/settings/starter/pushdown');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Edit starter exercise' }),
    );
    expect(
      await screen.findByRole('link', { name: 'Rope pushdown' }),
    ).toBeOnTheScreen();
    await fireEvent.changeText(
      await screen.findByLabelText('Name'),
      'Cable pushdown',
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Save exercise' }),
    );

    expect(await screen.findByText('Cable pushdown saved.')).toBeOnTheScreen();
    await expect(
      sent('PUT', `${exercisesPath}/pushdown`)[0].clone().json(),
    ).resolves.toEqual({
      name: 'Cable pushdown',
      groupId: 'triceps',
      alsoWorksGroupIds: [],
    });
    await clearNotification();
  });

  test('Delete asks first, then deletes', async () => {
    answerWith();
    await renderAt('/admin/settings/starter/pushdown');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Delete starter exercise' }),
    );
    expect(await screen.findByText('Delete Rope pushdown?')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Rope pushdown deleted.')).toBeOnTheScreen();
    expect(sent('DELETE', `${exercisesPath}/pushdown`)).toHaveLength(1);
    await clearNotification();
  });
});

describe('Starter groups', () => {
  test('the Groups chip opens the groups with their counts', async () => {
    answerWith();
    await renderAt('/admin/settings/starter');

    await fireEvent.press(await screen.findByRole('link', { name: 'Groups' }));

    expect(
      await screen.findByText('Groups new accounts start with.'),
    ).toBeOnTheScreen();
    expect(screen.getAllByText('1 exercise')).toHaveLength(2);
    expect(screen.getByText('0 exercises')).toBeOnTheScreen();
  });

  test('a new group is saved', async () => {
    answerWith();
    await renderAt('/admin/settings/starter/groups');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'New starter group' }),
    );
    await fireEvent.changeText(await screen.findByLabelText('Name'), 'Back');
    await fireEvent.press(screen.getByRole('button', { name: 'Save group' }));

    expect(await screen.findByText('Back created.')).toBeOnTheScreen();
    await expect(sent('POST', groupsPath)[0].clone().json()).resolves.toEqual({
      name: 'Back',
    });
    await clearNotification();
  });

  test('a group shows its exercises and those that also work it', async () => {
    answerWith();
    await renderAt('/admin/settings/starter/groups');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Triceps' }),
    );

    expect(await screen.findByText('2 exercises')).toBeOnTheScreen();
    expect(screen.getByText('Rope pushdown')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: /^Flat barbell bench press/ }),
    );
    expect(
      await screen.findByRole('link', { name: 'Triceps' }),
    ).toBeOnTheScreen();
  });

  test('an empty group says so in both sections', async () => {
    answerWith();
    await renderAt('/admin/settings/starter/groups/legs');

    expect(await screen.findAllByText('No exercises yet')).toHaveLength(2);
  });

  test('a group renames', async () => {
    answerWith();
    await renderAt('/admin/settings/starter/groups/edit/legs');

    await fireEvent.changeText(await screen.findByLabelText('Name'), 'Quads');
    await fireEvent.press(screen.getByRole('button', { name: 'Save group' }));

    expect(await screen.findByText('Quads saved.')).toBeOnTheScreen();
    expect(sent('PUT', `${groupsPath}/legs`)).toHaveLength(1);
    await clearNotification();
  });

  test('a group an exercise also works says why it can’t be deleted', async () => {
    answerWith({
      groups: [chest, { ...triceps, exerciseCount: 0 }],
      exercises: [benchPress],
    });
    await renderAt('/admin/settings/starter/groups/triceps');

    await fireEvent.press(
      await screen.findByRole('button', {
        name: 'Delete Triceps, not available',
      }),
    );

    expect(
      await screen.findByText('Move its exercises to another group first.'),
    ).toBeOnTheScreen();
    expect(sent('DELETE', `${groupsPath}/triceps`)).toHaveLength(0);
    await clearNotification();
  });

  test('an unused group asks first, then deletes', async () => {
    answerWith();
    await renderAt('/admin/settings/starter/groups/legs');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Delete Legs' }),
    );
    expect(await screen.findByText('Delete Legs?')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Legs deleted.')).toBeOnTheScreen();
    expect(sent('DELETE', `${groupsPath}/legs`)).toHaveLength(1);
    await clearNotification();
  });
});
