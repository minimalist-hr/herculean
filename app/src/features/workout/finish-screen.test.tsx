import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import { ThemeProvider } from '@/theme/theme-provider';

import { FinishScreen } from './finish-screen';
import { dismissNotification } from '@/components/notifications';
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

const summary = {
  name: 'Legs',
  date: '2026-11-03',
  durationSeconds: 3850,
  setsChecked: 17,
  setsTotal: 19,
  volumeKg: 9840,
  uncheckedExercises: [{ name: 'Leg curl', uncheckedSets: 2, sets: 2 }],
  records: [
    { name: 'Barbell squat', kind: 'heaviestWeight', weightKg: 85, reps: 8 },
    { name: 'Leg press', kind: 'mostReps', weightKg: 30, reps: 12 },
  ],
};

interface Answers {
  answer?: unknown;
  workoutAnswer?: unknown;
  summaryStatus?: number;
  patch?: () => Response;
  remove?: () => Response;
  restore?: () => Response;
}

function answerWith({
  answer = summary,
  workoutAnswer,
  summaryStatus = 200,
  patch = () =>
    Response.json({ id: 'w1', status: 'completed', name: 'Legs day' }),
  remove = () => new Response(null, { status: 204 }),
  restore = () => Response.json({ id: 'w1', status: 'inProgress' }),
}: Answers = {}) {
  mockFetch.mockImplementation((request) => {
    const { pathname } = new URL(request.url);
    if (request.method === 'PATCH') {
      return Promise.resolve(patch());
    }
    if (request.method === 'DELETE') {
      return Promise.resolve(remove());
    }
    if (request.method === 'POST') {
      return Promise.resolve(restore());
    }
    // Logging would hold the workout; here the summary alone says what it comes to.
    if (pathname === '/api/v1/workouts/w1') {
      return workoutAnswer === undefined
        ? new Promise<Response>(() => undefined)
        : Promise.resolve(Response.json(workoutAnswer));
    }
    if (pathname.endsWith('/summary')) {
      return Promise.resolve(
        summaryStatus === 200
          ? Response.json(answer)
          : new Response(null, { status: summaryStatus }),
      );
    }
    return Promise.resolve(Response.json({ units: 'metric' }));
  });
}

function requests(method: string) {
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

function Opens({ title, href }: { title: string; href: `./${string}` }) {
  const router = useRouter();

  return (
    <Text
      accessibilityRole="button"
      onPress={() => {
        router.push(href);
      }}
    >
      {title}
    </Text>
  );
}

function FinishRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <FinishScreen id={id} />;
}

/** The day, then logging, then the finish page, as a real workout gets there. */
async function renderFinish() {
  await renderRouter(
    {
      _layout: Layout,
      index: () => <Opens title="Day screen" href="./log" />,
      log: () => <Opens title="Logging screen" href="./finish/w1" />,
      'finish/[id]': FinishRoute,
    },
    { initialUrl: '/' },
  );
  await fireEvent.press(screen.getByText('Day screen'));
  await fireEvent.press(await screen.findByText('Logging screen'));
  await screen.findByText('Finish workout');
}

/** The button once the page has loaded. It shows, muted, before that. */
async function loadedButton(name: string) {
  await waitFor(() => {
    expect(screen.getByRole('button', { name })).toHaveStyle({ opacity: 1 });
  });

  return screen.getByRole('button', { name });
}

async function openDiscard() {
  await fireEvent.press(await loadedButton('Discard workout'));
  await screen.findByText('Discard this workout?');
}

/** The sheet's button, which is on top of the page's. */
async function confirmDiscard() {
  const buttons = screen.getAllByRole('button', { name: 'Discard workout' });
  await fireEvent.press(buttons[buttons.length - 1]);
}

beforeEach(() => {
  mockFetch.mockReset();
  dismissNotification();
});

test('shows what the workout comes to', async () => {
  answerWith();
  await renderFinish();

  expect(await screen.findByText('1:04:10')).toBeOnTheScreen();
  expect(screen.getByText('Legs · Tue, 3rd November')).toBeOnTheScreen();
  expect(screen.getByText('17 of 19')).toBeOnTheScreen();
  expect(screen.getByText('9,840 kg')).toBeOnTheScreen();
  expect(screen.getByText('2')).toBeOnTheScreen();
});

test('warns about unchecked sets', async () => {
  answerWith();
  await renderFinish();

  expect(await screen.findByText('2 sets not checked off')).toBeOnTheScreen();
  expect(
    screen.getByText(
      'Leg curl, both sets. They won’t be saved unless you go back and check them off.',
    ),
  ).toBeOnTheScreen();
});

test('lists new records with what they beat', async () => {
  answerWith();
  await renderFinish();

  expect(await screen.findByText('Barbell squat')).toBeOnTheScreen();
  expect(screen.getByText('Heaviest weight')).toBeOnTheScreen();
  expect(screen.getByText('85 kg × 8')).toBeOnTheScreen();
  expect(screen.getByText('Most reps at 30 kg')).toBeOnTheScreen();
  expect(screen.getByText('30 kg × 12')).toBeOnTheScreen();
});

test('a past day with every set checked has a dash, no warning and no records', async () => {
  answerWith({
    answer: {
      ...summary,
      durationSeconds: null,
      setsChecked: 19,
      uncheckedExercises: [],
      records: [],
    },
  });
  await renderFinish();

  expect(await screen.findByText('–')).toBeOnTheScreen();
  expect(screen.queryByText(/not checked off/)).toBeNull();
  expect(screen.getByText('No new records this time.')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Save workout' })).toBeTruthy();
});

test('with nothing checked it says so, and Save workout says why', async () => {
  answerWith({
    answer: {
      ...summary,
      setsChecked: 0,
      volumeKg: 0,
      records: [],
    },
  });
  await renderFinish();

  expect(await screen.findByText('No sets checked off')).toBeOnTheScreen();
  const save = screen.getByRole('button', { name: 'Save workout' });
  expect(save).not.toHaveStyle({ opacity: 1 });
  await fireEvent.press(save);
  expect(
    await screen.findByText('Check off a set to save, or discard the workout.'),
  ).toBeOnTheScreen();
  expect(requests('PATCH')).toHaveLength(0);
  await openDiscard();
  expect(
    screen.getByText('No sets are checked off. You can undo this right after.'),
  ).toBeOnTheScreen();
});

test('a load failure keeps both buttons, muted, and can be tried again', async () => {
  answerWith({ summaryStatus: 500 });
  await renderFinish();

  expect(
    await screen.findByText('Couldn’t load this workout.'),
  ).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Save workout' })).toHaveStyle({
    opacity: 0.5,
  });
  const discard = screen.getByRole('button', { name: 'Discard workout' });
  expect(discard).toHaveStyle({ opacity: 0.5 });
  await fireEvent.press(discard);
  expect(
    await screen.findByText('This page hasn’t loaded yet.'),
  ).toBeOnTheScreen();

  answerWith();
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(await screen.findByText('1:04:10')).toBeOnTheScreen();
});

test('the back link returns to logging', async () => {
  answerWith();
  await renderFinish();

  await fireEvent.press(screen.getByRole('link', { name: 'Logging' }));

  expect(await screen.findByText('Logging screen')).toBeOnTheScreen();
});

test('saving completes the workout and returns to the day', async () => {
  answerWith();
  await renderFinish();

  await fireEvent.press(await loadedButton('Save workout'));

  expect(await screen.findByText('Day screen')).toBeOnTheScreen();
  expect(await screen.findByText('Legs day saved.')).toBeOnTheScreen();
  await expect(requests('PATCH')[0][0].clone().json()).resolves.toEqual({
    status: 'completed',
    durationMinutes: null,
  });
});

const pastDay = {
  answer: { ...summary, durationSeconds: null },
  workoutAnswer: {
    id: 'w1',
    name: 'Legs',
    date: '2026-11-03',
    startedAtUtc: null,
    exercises: [],
  },
};
const durationLabel = 'Duration in minutes';

test('a past day takes its duration in minutes', async () => {
  answerWith(pastDay);
  await renderFinish();

  await fireEvent.changeText(await screen.findByLabelText(durationLabel), '75');

  await fireEvent.press(await loadedButton('Save workout'));
  await screen.findByText('Day screen');
  await expect(requests('PATCH')[0][0].clone().json()).resolves.toEqual({
    status: 'completed',
    durationMinutes: 75,
  });
});

test('a past day shows only Sets and Volume, with its duration typed and records below', async () => {
  answerWith(pastDay);
  await renderFinish();

  expect(await screen.findByLabelText(durationLabel)).toBeOnTheScreen();
  expect(await screen.findByText('17 of 19')).toBeOnTheScreen();
  expect(screen.getByText('9,840 kg')).toBeOnTheScreen();
  expect(screen.queryByText('Duration')).toBeNull();
  expect(screen.queryByText('Records')).toBeNull();
  expect(screen.getByText('New records')).toBeOnTheScreen();
});

test('a past day can be saved with no duration', async () => {
  answerWith(pastDay);
  await renderFinish();
  await screen.findByLabelText(durationLabel);

  await fireEvent.press(await loadedButton('Save workout'));
  await screen.findByText('Day screen');

  await expect(requests('PATCH')[0][0].clone().json()).resolves.toEqual({
    status: 'completed',
    durationMinutes: null,
  });
});

test.each([
  ['601', 'At most 600 minutes.'],
  ['0', 'At least 1 minute.'],
])('a duration of %s says so and saves nothing', async (typed, message) => {
  answerWith(pastDay);
  await renderFinish();

  await fireEvent.changeText(
    await screen.findByLabelText(durationLabel),
    typed,
  );
  await fireEvent.press(await loadedButton('Save workout'));

  expect(await screen.findByText(message)).toBeOnTheScreen();
  expect(requests('PATCH')).toHaveLength(0);
});

test('a timed workout has no duration field', async () => {
  answerWith({
    workoutAnswer: {
      ...pastDay.workoutAnswer,
      startedAtUtc: new Date(Date.now() - 600_000).toISOString(),
    },
  });
  await renderFinish();
  await loadedButton('Save workout');

  expect(screen.queryByLabelText(durationLabel)).toBeNull();
  expect(screen.queryByText('Long workout?')).toBeNull();
});

test('a timer over four hours asks about a forgotten Finish', async () => {
  answerWith({
    workoutAnswer: {
      ...pastDay.workoutAnswer,
      startedAtUtc: new Date(Date.now() - 5 * 3_600_000).toISOString(),
    },
  });
  await renderFinish();

  expect(await screen.findByText('Long workout?')).toBeOnTheScreen();
  expect(
    screen.getByText('You can correct the time after saving.'),
  ).toBeOnTheScreen();
});

test('a save that fails says so and stays', async () => {
  answerWith({ patch: () => new Response(null, { status: 500 }) });
  await renderFinish();

  await fireEvent.press(await loadedButton('Save workout'));

  expect(
    await screen.findByText('Couldn’t save the workout. Try again.'),
  ).toBeOnTheScreen();
  expect(screen.getByText('Finish workout')).toBeOnTheScreen();
});

test('discarding asks first, and closing the sheet changes nothing', async () => {
  answerWith();
  await renderFinish();

  await openDiscard();

  expect(
    screen.getByText(
      'Its 17 checked sets won’t be saved. You can undo this right after.',
    ),
  ).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));

  await waitFor(() => {
    expect(screen.queryByText('Discard this workout?')).toBeNull();
  });
  expect(requests('DELETE')).toHaveLength(0);
});

test('discarding returns to the day and offers an undo, which stays there', async () => {
  answerWith();
  await renderFinish();

  await openDiscard();
  await confirmDiscard();

  expect(await screen.findByText('Day screen')).toBeOnTheScreen();
  expect(await screen.findByText('Legs discarded.')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

  await waitFor(() => {
    expect(requests('POST')).toHaveLength(1);
  });
  expect(new URL(requests('POST')[0][0].url).pathname).toBe(
    '/api/v1/workouts/w1/restore',
  );
  expect(screen.getByText('Day screen')).toBeOnTheScreen();
});

test('an undo that fails says so', async () => {
  answerWith({ restore: () => new Response(null, { status: 500 }) });
  await renderFinish();

  await openDiscard();
  await confirmDiscard();
  await fireEvent.press(await screen.findByRole('button', { name: 'Undo' }));

  expect(
    await screen.findByText('Couldn’t undo. Try again.'),
  ).toBeOnTheScreen();
});

test('a discard that fails says so and stays', async () => {
  answerWith({ remove: () => new Response(null, { status: 500 }) });
  await renderFinish();

  await openDiscard();
  await confirmDiscard();

  expect(
    await screen.findByText('Couldn’t discard the workout. Try again.'),
  ).toBeOnTheScreen();
  expect(screen.getByText('Discard this workout?')).toBeOnTheScreen();
});
