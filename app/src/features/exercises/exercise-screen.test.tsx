import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ThemeProvider } from '@/theme/theme-provider';

import { ExerciseScreen } from './exercise-screen';

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

function exercise(group: string, alsoWorks: string[] = []) {
  return {
    id,
    name: 'Bench press',
    group: { id: group, name: group },
    alsoWorksGroups: alsoWorks.map((name) => ({ id: name, name })),
  };
}

function answer(body: unknown) {
  mockFetch.mockImplementation((request) =>
    Promise.resolve(
      Response.json(
        new URL(request.url).pathname === '/api/v1/groups' ? [] : body,
      ),
    ),
  );
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function renderExercise() {
  await renderRouter(
    {
      _layout: Layout,
      index: () => <PlaceholderScreen title="List screen" />,
      '[id]': () => <ExerciseScreen id={id} />,
      'exercise/[id]/edit': () => (
        <PlaceholderScreen title="Edit exercise page" />
      ),
    },
    { initialUrl: `/${id}` },
  );
}

beforeEach(() => {
  mockFetch.mockReset();
});

test('shows the skeleton, then the exercise', async () => {
  answer(exercise('Shoulders'));
  await renderExercise();

  expect(screen.getByLabelText('Loading the exercise')).toBeOnTheScreen();

  expect(
    await screen.findByRole('header', { name: 'Bench press' }),
  ).toBeOnTheScreen();
  expect(screen.queryByLabelText('Loading the exercise')).toBeNull();
  expect(mockFetch.mock.calls[0][0].url).toBe(
    `http://api.test/api/v1/exercises/${id}`,
  );
});

test('shows only the group when it works nothing else', async () => {
  answer(exercise('Shoulders'));
  await renderExercise();

  expect(await screen.findByText('Shoulders')).toBeOnTheScreen();
});

test('adds the also works groups in lower case', async () => {
  answer(exercise('Chest', ['Shoulders', 'Triceps']));
  await renderExercise();

  expect(
    await screen.findByText('Chest · shoulders · triceps'),
  ).toBeOnTheScreen();
});

test('shows that it has no sessions and is in no routine', async () => {
  answer(exercise('Shoulders'));
  await renderExercise();

  expect(await screen.findByText('No sessions yet')).toBeOnTheScreen();
  expect(
    screen.getByText(
      'Finish a workout with this exercise and its sets, best set and progress show up here.',
    ),
  ).toBeOnTheScreen();
  expect(screen.getByText('Used in')).toBeOnTheScreen();
  expect(
    screen.getByText(
      'Not in any routine yet. Add it from Edit routine on the Routines tab.',
    ),
  ).toBeOnTheScreen();
});

test('a failed read says so, and Try again reads it again', async () => {
  mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  await renderExercise();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't load this exercise.",
  );

  answer(exercise('Shoulders'));
  await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

  expect(
    await screen.findByRole('header', { name: 'Bench press' }),
  ).toBeOnTheScreen();
  expect(screen.queryByRole('alert')).toBeNull();
});

test('the edit button opens the edit page', async () => {
  answer(exercise('Shoulders'));
  await renderExercise();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Edit exercise' }),
  );

  expect(await screen.findByText('Edit exercise page')).toBeOnTheScreen();
});

test('the edit button waits for the exercise', async () => {
  mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  await renderExercise();

  await screen.findByRole('alert');

  expect(screen.queryByRole('button', { name: 'Edit exercise' })).toBeNull();
});

test('the back link is there while it loads', async () => {
  answer(exercise('Shoulders'));
  await renderExercise();

  expect(screen.getByRole('link', { name: 'Exercises' })).toBeOnTheScreen();
  await screen.findByRole('header', { name: 'Bench press' });
});
