import { QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { StyleSheet } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import { PlaceholderScreen } from '@/test-utils/placeholder-screen';
import { ThemeProvider } from '@/theme/theme-provider';

import { LogScreen } from './log-screen';
import { restTextSize } from './rest-bar';
import { createTestQueryClient } from '@/test-utils/query-client';

const mockFetch = jest.fn<Promise<Response>, [Request]>();
const mockStored = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: (key: string) => Promise.resolve(mockStored.get(key) ?? null),
  setItemAsync: (key: string, value: string) => {
    mockStored.set(key, value);

    return Promise.resolve();
  },
  deleteItemAsync: (key: string) => {
    mockStored.delete(key);

    return Promise.resolve();
  },
}));

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

function set(id: string, order: number, weightKg: number, checked = false) {
  return { id, order, weightKg, reps: 8, checked };
}

function exercise(id: string, name: string, groupId: string, sets: unknown[]) {
  return {
    id,
    exerciseId: `${id}-exercise`,
    name,
    groupId,
    groupName: 'Legs',
    targetSets: 2,
    targetRepsFrom: 8,
    targetRepsTo: 10,
    sets,
    lastTime: {
      date: '2026-10-27',
      sets: [{ weightKg: 80, reps: 10 }],
    },
  };
}

const workout = {
  id: 'w1',
  date: '2026-11-03',
  status: 'inProgress',
  name: 'Legs day',
  startedAtUtc: '2026-11-03T10:00:00Z',
  exercises: [
    exercise('squat', 'Barbell squat', 'legs', [
      set('s1', 0, 80),
      set('s2', 1, 80),
    ]),
    exercise('press', 'Leg press', 'legs', [set('p1', 0, 120)]),
  ],
};

let current: typeof workout | { status: number };
let patched: (body: unknown) => unknown;

function answerWith(request: Request) {
  const { pathname } = new URL(request.url);
  if (request.method === 'PATCH') {
    return request
      .clone()
      .json()
      .then((body: unknown) => Response.json(patched(body)));
  }

  if (request.method === 'DELETE') {
    return Promise.resolve(new Response(null, { status: 204 }));
  }

  if (request.method === 'POST') {
    return Promise.resolve(Response.json(set('s3', 2, 80), { status: 201 }));
  }

  if (pathname === '/api/v1/workout-settings') {
    return Promise.resolve(
      Response.json({
        defaultRestSeconds: 180,
        restSound: true,
        restVibrate: true,
      }),
    );
  }

  if (pathname === '/api/v1/users/me') {
    return Promise.resolve(Response.json({ units: 'metric' }));
  }

  return Promise.resolve(
    'status' in current && typeof current.status === 'number'
      ? Response.json(
          { code: 'workout.not_found', status: 404 },
          { status: 404 },
        )
      : Response.json(current),
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

async function renderLog() {
  await renderRouter(
    {
      _layout: Layout,
      index: () => <PlaceholderScreen title="Workout screen" />,
      log: () => <LogScreen id="w1" />,
      'workout/log/[id]/add': () => <PlaceholderScreen title="Add screen" />,
      'workout/log/[id]/finish': () => (
        <PlaceholderScreen title="Finish screen" />
      ),
      'workout/log/[id]/reorder': () => (
        <PlaceholderScreen title="Reorder screen" />
      ),
      'workout/exercise/[id]': () => (
        <PlaceholderScreen title="Exercise screen" />
      ),
    },
    { initialUrl: '/log' },
  );
}

beforeEach(() => {
  mockStored.clear();
  current = workout;
  patched = () => [];
  mockFetch.mockReset();
  mockFetch.mockImplementation(answerWith);
  jest.useFakeTimers({
    now: new Date('2026-11-03T10:06:40Z'),
    doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'],
  });
});

afterEach(() => {
  jest.useRealTimers();
});

test('shows the heading, with the date, the running time and the progress', async () => {
  await renderLog();

  expect(await screen.findByText('Legs day')).toBeOnTheScreen();
  expect(screen.getByText('Tue, 3rd November · 6:40')).toBeOnTheScreen();
  expect(screen.getByText(/of 3 sets/)).toBeOnTheScreen();

  await act(async () => {
    await jest.advanceTimersByTimeAsync(1000);
  });

  expect(screen.getByText('Tue, 3rd November · 6:41')).toBeOnTheScreen();
});

test('a past day has no running time', async () => {
  current = { ...workout, startedAtUtc: null as unknown as string };
  await renderLog();

  expect(await screen.findByText('Tue, 3rd November')).toBeOnTheScreen();
});

test('opens the first unfinished exercise, with last time for its sets', async () => {
  current = {
    ...workout,
    exercises: [
      exercise('squat', 'Barbell squat', 'legs', [set('s1', 0, 80, true)]),
      exercise('press', 'Leg press', 'legs', [set('p1', 0, 120)]),
    ],
  };
  await renderLog();

  await screen.findByText('Legs day');
  const open = within(screen.getByTestId('open-exercise'));
  expect(open.getByText('Leg press')).toBeOnTheScreen();
  expect(open.getByRole('button', { name: 'Add set' })).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Open Barbell squat' }),
  ).toBeTruthy();
  expect(screen.getByText('1/1')).toBeOnTheScreen();
  expect(open.getByText('80 × 10')).toBeOnTheScreen();
});

test('a set with nothing from last time shows a dash', async () => {
  await renderLog();

  await screen.findByText('Legs day');
  expect(screen.getByText('–')).toBeOnTheScreen();
});

test('any exercise can be tapped open, and only one is open', async () => {
  await renderLog();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Open Leg press' }),
  );

  const open = within(screen.getByTestId('open-exercise'));
  expect(open.getByText('Leg press')).toBeOnTheScreen();
  expect(open.queryByText('Barbell squat')).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Open Barbell squat' }),
  ).toBeTruthy();
});

test('checking a set saves it and stays on the exercise', async () => {
  patched = () => [set('s1', 0, 80, true), set('s2', 1, 80)];
  await renderLog();

  await fireEvent.press(
    await screen.findByRole('checkbox', { name: 'Set 1 done' }),
  );

  expect(
    await screen.findByRole('checkbox', {
      name: 'Set 1 done',
      checked: true,
    }),
  ).toBeOnTheScreen();
  const request = mockFetch.mock.calls.find(
    ([sent]) => sent.method === 'PATCH',
  )?.[0];
  expect(new URL(request?.url ?? '').pathname).toBe(
    '/api/v1/workouts/w1/exercises/squat/sets/s1',
  );
  expect(
    within(screen.getByTestId('open-exercise')).getByText('Barbell squat'),
  ).toBeOnTheScreen();
});

test('checking the last set opens the next exercise', async () => {
  current = {
    ...workout,
    exercises: [
      exercise('squat', 'Barbell squat', 'legs', [set('s1', 0, 80)]),
      exercise('press', 'Leg press', 'legs', [set('p1', 0, 120)]),
    ],
  };
  patched = () => [set('s1', 0, 80, true)];
  await renderLog();

  await fireEvent.press(
    await screen.findByRole('checkbox', { name: 'Set 1 done' }),
  );

  expect(
    await screen.findByRole('button', { name: 'Open Barbell squat' }),
  ).toBeOnTheScreen();
  expect(
    within(screen.getByTestId('open-exercise')).getByText('Leg press'),
  ).toBeOnTheScreen();
});

test('a checked set can be unchecked', async () => {
  current = {
    ...workout,
    exercises: [
      exercise('squat', 'Barbell squat', 'legs', [
        set('s1', 0, 80, true),
        set('s2', 1, 80),
      ]),
    ],
  };
  patched = () => [set('s1', 0, 80), set('s2', 1, 80)];
  await renderLog();

  await fireEvent.press(
    await screen.findByRole('checkbox', { name: 'Set 1 done', checked: true }),
  );

  expect(
    await screen.findByRole('checkbox', { name: 'Set 1 done', checked: false }),
  ).toBeOnTheScreen();
});

test('a failed save says so and leaves the set as it was', async () => {
  mockFetch.mockImplementation((request) =>
    request.method === 'PATCH'
      ? Promise.resolve(
          Response.json({ code: 'oops', status: 500 }, { status: 500 }),
        )
      : answerWith(request),
  );
  await renderLog();

  await fireEvent.press(
    await screen.findByRole('checkbox', { name: 'Set 1 done' }),
  );

  expect(
    await screen.findByText('Couldn’t save the set. Try again.'),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('checkbox', { name: 'Set 1 done', checked: false }),
  ).toBeOnTheScreen();
});

test('Add set adds the new set to the exercise', async () => {
  await renderLog();

  await fireEvent.press(await screen.findByRole('button', { name: 'Add set' }));

  expect(
    await screen.findByRole('checkbox', { name: 'Set 3 done' }),
  ).toBeOnTheScreen();
  expect(screen.getByText(/of 4 sets/)).toBeOnTheScreen();
});

test('a failed Add set says so', async () => {
  mockFetch.mockImplementation((request) =>
    request.method === 'POST'
      ? Promise.resolve(
          Response.json({ code: 'oops', status: 500 }, { status: 500 }),
        )
      : answerWith(request),
  );
  await renderLog();

  await fireEvent.press(await screen.findByRole('button', { name: 'Add set' }));

  expect(
    await screen.findByText('Couldn’t add the set. Try again.'),
  ).toBeOnTheScreen();
});

test('Finish opens the finish page', async () => {
  await renderLog();

  await fireEvent.press(await screen.findByRole('button', { name: 'Finish' }));

  expect(await screen.findByText('Finish screen')).toBeOnTheScreen();
});

test('the name opens the exercise, and there is no other way to it', async () => {
  await renderLog();

  await screen.findByText('Legs day');
  expect(screen.queryByRole('button', { name: 'History' })).toBeNull();

  await fireEvent.press(
    screen.getByRole('link', { name: 'Barbell squat details' }),
  );

  expect(await screen.findByText('Exercise screen')).toBeOnTheScreen();
});

test('the Set label is gone, and the other columns stay', async () => {
  await renderLog();

  await screen.findByText('Legs day');
  expect(
    screen.getByText('Last time', { includeHiddenElements: true }),
  ).toBeOnTheScreen();
  expect(screen.queryByText('Set', { includeHiddenElements: true })).toBeNull();
});

test('checking the very last set closes its card', async () => {
  current = {
    ...workout,
    exercises: [exercise('squat', 'Barbell squat', 'legs', [set('s1', 0, 80)])],
  };
  patched = () => [set('s1', 0, 80, true)];
  await renderLog();

  await fireEvent.press(
    await screen.findByRole('checkbox', { name: 'Set 1 done' }),
  );

  expect(
    await screen.findByRole('button', { name: 'Open Barbell squat' }),
  ).toBeOnTheScreen();
  expect(screen.queryByTestId('open-exercise')).toBeNull();
});

test('a finished exercise can be opened again', async () => {
  current = {
    ...workout,
    exercises: [
      exercise('squat', 'Barbell squat', 'legs', [set('s1', 0, 80, true)]),
    ],
  };
  await renderLog();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Open Barbell squat' }),
  );

  expect(screen.getByTestId('open-exercise')).toBeOnTheScreen();
});

describe('editing a set', () => {
  function bodyOf(method: string) {
    const request = mockFetch.mock.calls.find(
      ([sent]) => sent.method === method,
    )?.[0];

    return request?.clone().json();
  }

  async function openWeight() {
    await renderLog();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Set 1 weight, 80 kilograms' }),
    );
    await screen.findByRole('button', { name: 'Save set' });
  }

  async function pressKeys(...names: string[]) {
    for (const name of names) {
      await fireEvent.press(screen.getByRole('button', { name }));
    }
  }

  test('tapping the row opens the sheet on weight', async () => {
    await renderLog();

    await fireEvent.press(await screen.findByTestId('set-row-1'));

    expect(
      await screen.findByRole('button', {
        name: 'Weight, 80 kilograms',
        selected: true,
      }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Set 1 · Barbell squat')).toBeOnTheScreen();
    expect(screen.getByText('Last time')).toBeOnTheScreen();
    expect(screen.getByText('80 kg × 10')).toBeOnTheScreen();
  });

  test('tapping reps opens the sheet on reps', async () => {
    await renderLog();

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Set 1 reps, 8' }),
    );

    expect(
      await screen.findByRole('button', { name: 'Reps, 8', selected: true }),
    ).toBeOnTheScreen();
  });

  test('the first key replaces the value, and Save set sends what changed', async () => {
    patched = () => [set('s1', 0, 95), set('s2', 1, 95)];
    await openWeight();

    await pressKeys('9', '5');
    expect(
      screen.getByRole('button', { name: 'Weight, 95 kilograms' }),
    ).toBeOnTheScreen();
    await pressKeys('Save set');

    expect(await bodyOf('PATCH')).toEqual({ weightKg: 95 });
    expect(
      await screen.findByRole('button', {
        name: 'Set 2 weight, 95 kilograms',
        includeHiddenElements: true,
      }),
    ).toBeOnTheScreen();
  });

  test('the steppers change the value by a step', async () => {
    await openWeight();

    await pressKeys('+ 2.5 kg');

    expect(
      screen.getByRole('button', { name: 'Weight, 82.5 kilograms' }),
    ).toBeOnTheScreen();

    await pressKeys('Reps, 8', '− 1 rep');

    expect(screen.getByRole('button', { name: 'Reps, 7' })).toBeOnTheScreen();
  });

  test('closing without saving forgets the change', async () => {
    await openWeight();

    await pressKeys('9', 'Close');
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Save set' })).toBeNull();
    });
    await fireEvent.press(
      screen.getByRole('button', { name: 'Set 1 weight, 80 kilograms' }),
    );

    expect(
      await screen.findByRole('button', { name: 'Weight, 80 kilograms' }),
    ).toBeOnTheScreen();
  });

  test('the keys give way when the sheet does not fit, down to a least height', async () => {
    await openWeight();
    expect(screen.getByRole('button', { name: '5' })).toHaveStyle({
      height: 52,
    });

    await fireEvent(screen.getByTestId('sheet-drag'), 'layout', {
      nativeEvent: { layout: { height: 5000 } },
    });
    await fireEvent(screen.getByTestId('sheet-actions'), 'layout', {
      nativeEvent: { layout: { height: 100 } },
    });
    // The event finds the sheet's scroll view from a key inside it.
    await fireEvent(
      screen.getByRole('button', { name: '5' }),
      'contentSizeChange',
      300,
      400,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '5' })).toHaveStyle({
        height: 40,
      });
    });
  });

  test('Save set with nothing changed sends nothing', async () => {
    await openWeight();

    await pressKeys('Save set');

    expect(mockFetch.mock.calls.some(([sent]) => sent.method === 'PATCH')).toBe(
      false,
    );
  });

  test('a value out of range says why, and stays open', async () => {
    await openWeight();

    await pressKeys('Reps, 8', 'Delete');
    await pressKeys('Save set');

    expect(await screen.findByText('At least 1 rep.')).toBeOnTheScreen();
    expect(mockFetch.mock.calls.some(([sent]) => sent.method === 'PATCH')).toBe(
      false,
    );
  });

  test('reps have no decimal point, and say so', async () => {
    await openWeight();

    await pressKeys('Reps, 8', 'Decimal point');

    expect(
      await screen.findByText('Reps are whole numbers.'),
    ).toBeOnTheScreen();
  });

  test('the trash removes the set, and Undo puts it back', async () => {
    await openWeight();

    await pressKeys('Remove set');

    expect(await screen.findByText('Set 1 removed.')).toBeOnTheScreen();
    expect(
      await screen.findByText(/of 2 sets/, { includeHiddenElements: true }),
    ).toBeOnTheScreen();

    await pressKeys('Undo');

    await waitFor(() => {
      expect(
        screen.getByText(/of 3 sets/, { includeHiddenElements: true }),
      ).toBeOnTheScreen();
    });
    const undo = mockFetch.mock.calls.find(
      ([sent]) => sent.method === 'POST',
    )?.[0];
    expect(await undo?.clone().json()).toEqual({
      removed: { order: 0, weightKg: 80, reps: 8, checked: false },
    });
  });

  test('the last set stays, and says why', async () => {
    current = {
      ...workout,
      exercises: [
        exercise('squat', 'Barbell squat', 'legs', [set('s1', 0, 80)]),
      ],
    };
    await openWeight();

    await pressKeys('Remove set');

    expect(
      await screen.findByText(
        'An exercise keeps at least one set. Use the exercise’s trash to remove it.',
      ),
    ).toBeOnTheScreen();
    expect(
      mockFetch.mock.calls.some(([sent]) => sent.method === 'DELETE'),
    ).toBe(false);
  });
});

test('Add set at 20 sets says why, and adds nothing', async () => {
  current = {
    ...workout,
    exercises: [
      exercise(
        'squat',
        'Barbell squat',
        'legs',
        Array.from({ length: 20 }, (_, order) =>
          set(`s${String(order)}`, order, 80),
        ),
      ),
    ],
  };
  await renderLog();

  await fireEvent.press(await screen.findByRole('button', { name: 'Add set' }));

  expect(
    await screen.findByText('An exercise can have at most 20 sets.'),
  ).toBeOnTheScreen();
  expect(mockFetch.mock.calls.some(([sent]) => sent.method === 'POST')).toBe(
    false,
  );
});

describe('the size of the rest text', () => {
  test.each([
    [390, 1, 22],
    [430, 1, 22],
    [360, 1, 20],
    [360, 1.3, 15],
  ])('on a %i wide screen at font scale %d is %i', (width, scale, size) => {
    expect(restTextSize(width, scale)).toBe(size);
  });
});

describe('the rest timer', () => {
  const checkFirst = async () => {
    await fireEvent.press(
      await screen.findByRole('checkbox', { name: 'Set 1 done' }),
    );
  };

  beforeEach(() => {
    patched = () => [set('s1', 0, 80, true), set('s2', 1, 80)];
  });

  test('has nothing to show before a set is checked', async () => {
    await renderLog();

    await screen.findByText('Legs day');
    expect(screen.queryByText(/REST/)).toBeNull();
  });

  test('appears after a checked set, and does not start by itself', async () => {
    await renderLog();

    await checkFirst();

    expect(
      await screen.findByRole('button', { name: 'Start' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('3:00')).toBeOnTheScreen();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000);
    });

    expect(screen.getByText('3:00')).toBeOnTheScreen();
  });

  test('takes the default rest time from the settings', async () => {
    mockFetch.mockImplementation((request) =>
      new URL(request.url).pathname === '/api/v1/workout-settings'
        ? Promise.resolve(Response.json({ defaultRestSeconds: 90 }))
        : answerWith(request),
    );
    await renderLog();

    await waitFor(() => {
      expect(
        mockFetch.mock.calls.some(([sent]) =>
          sent.url.endsWith('/workout-settings'),
        ),
      ).toBe(true);
    });
    await checkFirst();

    expect(await screen.findByText('1:30')).toBeOnTheScreen();
  });

  test('counts down once started, with Skip', async () => {
    await renderLog();
    await checkFirst();

    await fireEvent.press(await screen.findByRole('button', { name: 'Start' }));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(6000);
    });

    expect(screen.getByText('2:54')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeOnTheScreen();
  });

  test('the text keeps its size when the time changes', async () => {
    await renderLog();
    await checkFirst();
    await screen.findByRole('button', { name: 'Start' });
    const size = () => screen.getByText(/REST/).props.style as object;
    const before = StyleSheet.flatten(size());

    await fireEvent.press(
      screen.getByRole('button', { name: 'Add 15 seconds' }),
    );

    expect(StyleSheet.flatten(size())).toEqual(before);
    expect(screen.getByText(/REST/).props.adjustsFontSizeToFit).toBeUndefined();
  });

  test('−15 and +15 change the time', async () => {
    await renderLog();
    await checkFirst();

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Add 15 seconds' }),
    );
    expect(screen.getByText('3:15')).toBeOnTheScreen();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Subtract 15 seconds' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Subtract 15 seconds' }),
    );
    expect(screen.getByText('2:45')).toBeOnTheScreen();
  });

  test('counts up past zero in the over state, and Done tucks it away', async () => {
    await renderLog();
    await checkFirst();

    await fireEvent.press(await screen.findByRole('button', { name: 'Start' }));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(222_000);
    });

    expect(screen.getByText('+0:42')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Add 15 seconds' })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));

    expect(
      await screen.findByRole('button', { name: 'Show rest timer, 3:00' }),
    ).toBeOnTheScreen();
  });

  test('can be hidden and opened again, still running', async () => {
    await renderLog();
    await checkFirst();
    await fireEvent.press(await screen.findByRole('button', { name: 'Start' }));

    await fireEvent.press(
      screen.getByRole('button', { name: 'Hide rest timer' }),
    );
    await act(async () => {
      await jest.advanceTimersByTimeAsync(6000);
    });

    await fireEvent.press(
      screen.getByRole('button', { name: 'Show rest timer, 2:54' }),
    );

    expect(screen.getByRole('button', { name: 'Skip' })).toBeOnTheScreen();
  });

  test('the last set of the workout has no timer', async () => {
    current = {
      ...workout,
      exercises: [
        exercise('squat', 'Barbell squat', 'legs', [set('s1', 0, 80)]),
      ],
    };
    patched = () => [set('s1', 0, 80, true)];
    await renderLog();

    await checkFirst();

    await screen.findByRole('button', { name: 'Open Barbell squat' });
    expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
  });

  test('a past day has no timer', async () => {
    current = { ...workout, startedAtUtc: null as unknown as string };
    await renderLog();

    await checkFirst();

    await screen.findByRole('checkbox', { name: 'Set 1 done', checked: true });
    expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
  });

  test('unchecking the only checked set removes a timer not started', async () => {
    await renderLog();
    await checkFirst();
    await screen.findByRole('button', { name: 'Start' });

    patched = () => [set('s1', 0, 80), set('s2', 1, 80)];
    await fireEvent.press(
      screen.getByRole('checkbox', { name: 'Set 1 done', checked: true }),
    );

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
    });
    expect(
      screen.queryByRole('button', { name: /Show rest timer/ }),
    ).toBeNull();
  });

  test('comes back as it was after leaving and returning', async () => {
    mockStored.set(
      'restTimer',
      JSON.stringify({
        workoutId: 'w1',
        rest: {
          exerciseId: 'squat',
          seconds: 180,
          endsAt: Date.now() + 100_000,
          open: true,
          hiddenByUser: false,
        },
      }),
    );
    await renderLog();

    expect(await screen.findByText('1:40')).toBeOnTheScreen();
  });

  test('ignores another workout’s timer', async () => {
    mockStored.set(
      'restTimer',
      JSON.stringify({ workoutId: 'other', rest: { seconds: 180 } }),
    );
    await renderLog();

    await screen.findByText('Legs day');
    expect(screen.queryByText(/REST/)).toBeNull();
  });
});

describe('removing an exercise', () => {
  const askToRemove = async (name = 'Barbell squat') => {
    await fireEvent.press(
      await screen.findByRole('button', { name: `Remove ${name}` }),
    );
    await screen.findByRole('button', { name: 'Remove exercise' });
  };
  const hidden = { includeHiddenElements: true };

  test('asks first, and says what goes with it', async () => {
    current = {
      ...workout,
      exercises: [
        exercise('squat', 'Barbell squat', 'legs', [
          set('s1', 0, 80, true),
          set('s2', 1, 80),
          set('s3', 2, 80),
        ]),
        exercise('press', 'Leg press', 'legs', [set('p1', 0, 120)]),
      ],
    };
    await renderLog();

    await askToRemove();

    expect(screen.getByText('Remove Barbell squat?')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Its 3 sets, including the one you’ve logged, will be removed from this workout.',
      ),
    ).toBeOnTheScreen();
    expect(
      mockFetch.mock.calls.some(([sent]) => sent.method === 'DELETE'),
    ).toBe(false);
  });

  test.each([
    [[set('s1', 0, 80)], 'Its set will be removed from this workout.'],
    [
      [set('s1', 0, 80), set('s2', 1, 80)],
      'Its 2 sets will be removed from this workout.',
    ],
    [
      [set('s1', 0, 80, true), set('s2', 1, 80, true), set('s3', 2, 80)],
      'Its 3 sets, including the 2 you’ve logged, will be removed from this workout.',
    ],
  ])('says it plainly for %#', async (sets, message) => {
    current = {
      ...workout,
      exercises: [exercise('squat', 'Barbell squat', 'legs', sets)],
    };
    await renderLog();

    await askToRemove();

    expect(screen.getByText(message)).toBeOnTheScreen();
  });

  test('removes it, opens the next one, and Undo sends it back with its sets', async () => {
    mockFetch.mockImplementation((request) =>
      request.method === 'POST'
        ? Promise.resolve(Response.json(workout))
        : answerWith(request),
    );
    await renderLog();

    await askToRemove();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Remove exercise' }),
    );

    expect(await screen.findByText('Barbell squat removed.')).toBeOnTheScreen();
    await waitFor(() => {
      expect(
        within(screen.getByTestId('open-exercise', hidden)).getByText(
          'Leg press',
          hidden,
        ),
      ).toBeOnTheScreen();
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

    expect(
      await screen.findByRole('button', {
        name: 'Remove Barbell squat',
        ...hidden,
      }),
    ).toBeOnTheScreen();
    const undo = mockFetch.mock.calls.find(
      ([sent]) => sent.method === 'POST',
    )?.[0];
    expect(new URL(undo?.url ?? '').pathname).toBe(
      '/api/v1/workouts/w1/exercises',
    );
    expect(await undo?.clone().json()).toEqual({
      removed: {
        order: 0,
        exerciseId: 'squat-exercise',
        targetSets: 2,
        targetRepsFrom: 8,
        targetRepsTo: 10,
        sets: [
          { weightKg: 80, reps: 8, checked: false },
          { weightKg: 80, reps: 8, checked: false },
        ],
      },
    });
  });

  test('a failed removal says so and keeps it', async () => {
    mockFetch.mockImplementation((request) =>
      request.method === 'DELETE'
        ? Promise.resolve(
            Response.json({ code: 'oops', status: 500 }, { status: 500 }),
          )
        : answerWith(request),
    );
    await renderLog();

    await askToRemove();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Remove exercise' }),
    );

    expect(
      await screen.findByText('Couldn’t remove the exercise. Try again.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Barbell squat', hidden)).toBeOnTheScreen();
  });

  test('a failed Undo says so', async () => {
    mockFetch.mockImplementation((request) =>
      request.method === 'POST'
        ? Promise.resolve(
            Response.json({ code: 'oops', status: 500 }, { status: 500 }),
          )
        : answerWith(request),
    );
    await renderLog();

    await askToRemove();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Remove exercise' }),
    );
    await fireEvent.press(await screen.findByRole('button', { name: 'Undo' }));

    expect(
      await screen.findByText('Couldn’t undo. Try again.'),
    ).toBeOnTheScreen();
  });

  describe('the last one', () => {
    beforeEach(() => {
      current = {
        ...workout,
        exercises: [
          exercise('squat', 'Barbell squat', 'legs', [
            set('s1', 0, 80),
            set('s2', 1, 80),
          ]),
        ],
      };
    });

    test('leaves a workout with no exercises', async () => {
      await renderLog();

      await askToRemove();
      await fireEvent.press(
        screen.getByRole('button', { name: 'Remove exercise' }),
      );

      expect(
        await screen.findByText('No exercises left', hidden),
      ).toBeOnTheScreen();
      expect(
        screen.getByText('Add an exercise to keep logging.', hidden),
      ).toBeOnTheScreen();
      expect(
        screen.getByRole('button', { name: 'Add exercise', ...hidden }),
      ).toBeOnTheScreen();
      expect(
        screen.getByRole('button', { name: 'Reorder', ...hidden }),
      ).not.toHaveStyle({ opacity: 1 });
      expect(screen.getByText(/0 of 0 sets/, hidden)).toBeOnTheScreen();
      expect(
        screen.getByRole('button', { name: 'Finish', ...hidden }),
      ).toBeOnTheScreen();
    });

    test('takes a running rest timer with it', async () => {
      patched = () => [set('s1', 0, 80, true), set('s2', 1, 80)];
      await renderLog();
      await fireEvent.press(
        await screen.findByRole('checkbox', { name: 'Set 1 done' }),
      );
      await fireEvent.press(
        await screen.findByRole('button', { name: 'Start' }),
      );

      await askToRemove();
      await fireEvent.press(
        screen.getByRole('button', { name: 'Remove exercise' }),
      );

      await screen.findByText('No exercises left', hidden);
      expect(screen.queryByText(/REST/, hidden)).toBeNull();
    });
  });
});

test('an exercise that was just added opens', async () => {
  const client = createTestQueryClient();
  await renderRouter(
    {
      _layout: () => (
        <QueryClientProvider client={client}>
          <ThemeProvider theme="dark">
            <Stack screenOptions={{ headerShown: false }} />
          </ThemeProvider>
        </QueryClientProvider>
      ),
      log: () => <LogScreen id="w1" />,
    },
    { initialUrl: '/log' },
  );
  await screen.findByRole('button', { name: 'Open Leg press' });

  await act(() => {
    client.setQueryData(['workout', 'w1'], {
      ...workout,
      exercises: [
        ...workout.exercises,
        exercise('curl', 'Curl', 'arms', [set('c1', 0, 20)]),
      ],
    });
  });

  await waitFor(() => {
    expect(
      within(screen.getByTestId('open-exercise')).getByText('Curl'),
    ).toBeOnTheScreen();
  });
});

test('the swap icon opens the picker for that exercise', async () => {
  await renderLog();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Swap Barbell squat' }),
  );

  expect(await screen.findByText('Add screen')).toBeOnTheScreen();
});

test('with a checked set, the swap icon says why, and stays', async () => {
  current = {
    ...workout,
    exercises: [
      exercise('squat', 'Barbell squat', 'legs', [
        set('s1', 0, 80, true),
        set('s2', 1, 80),
      ]),
    ],
  };
  await renderLog();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Swap Barbell squat' }),
  );

  expect(
    await screen.findByText(
      'An exercise with checked sets can’t be swapped. Uncheck them first.',
    ),
  ).toBeOnTheScreen();
  expect(screen.queryByText('Add screen')).toBeNull();
});

test('Add exercise opens its page', async () => {
  await renderLog();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Add exercise' }),
  );

  expect(await screen.findByText('Add screen')).toBeOnTheScreen();
});

test('Add exercise at 30 exercises says why, and stays', async () => {
  current = {
    ...workout,
    exercises: Array.from({ length: 30 }, (_, index) =>
      exercise(`e${String(index)}`, `Exercise ${String(index)}`, 'legs', [
        set(`s${String(index)}`, 0, 80),
      ]),
    ),
  };
  await renderLog();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Add exercise' }),
  );

  expect(
    await screen.findByText('A workout can have at most 30 exercises.'),
  ).toBeOnTheScreen();
  expect(screen.queryByText('Add screen')).toBeNull();
});

test('Reorder opens its page', async () => {
  await renderLog();

  await fireEvent.press(await screen.findByRole('button', { name: 'Reorder' }));

  expect(await screen.findByText('Reorder screen')).toBeOnTheScreen();
});

test('a failed load offers to try again', async () => {
  current = { status: 404 };
  await renderLog();

  expect(
    await screen.findByText('Couldn’t load this workout.'),
  ).toBeOnTheScreen();

  current = workout;
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('Legs day')).toBeOnTheScreen();
});

test('while it loads, Finish stays in place, muted, and says why', async () => {
  mockFetch.mockImplementation(() => new Promise(() => undefined));
  await renderLog();

  expect(screen.getByLabelText('Loading this workout')).toBeOnTheScreen();
  const finish = screen.getByRole('button', { name: 'Finish' });
  expect(finish).toHaveStyle({ opacity: 0.5 });
  await fireEvent.press(finish);

  expect(
    await screen.findByText('This page hasn’t loaded yet.'),
  ).toBeOnTheScreen();
  expect(screen.queryByText('Finish screen')).toBeNull();
});
