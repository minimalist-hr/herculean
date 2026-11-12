import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent } from '@testing-library/react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  renderRouter,
  screen,
  type RenderRouterResult,
} from 'expo-router/testing-library';
import { Pressable, Text } from 'react-native';

import { exerciseKeys } from '@/features/exercises/query-keys';
import { routineKeys } from '@/features/routines/query-keys';
import { createTestQueryClient } from '@/test-utils/query-client';
import { ThemeProvider } from '@/theme/theme-provider';

import { FromBackLink } from './from-back-link';
import { useLinks } from './use-links';

let queryClient = createTestQueryClient();
let rendered: RenderRouterResult;

function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme="default">
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    />
  );
}

/** An exercise page: it opens a routine, and goes back by the link. */
function ExercisePage() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const links = useLinks(`exercise:${id}`);

  return (
    <>
      <FromBackLink from={from} fallback="Exercises" />
      <Text>{`Exercise ${id}`}</Text>
      <Button
        label="Open Legs"
        onPress={() => {
          links.routine('legs');
        }}
      />
    </>
  );
}

/** A routine page: it opens an exercise. */
function RoutinePage() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const links = useLinks(`routine:${id}`);

  return (
    <>
      <FromBackLink from={from} fallback="Routines" />
      <Text>{`Routine ${id}`}</Text>
      <Button
        label="Open squat"
        onPress={() => {
          links.exercise('squat');
        }}
      />
      <Button
        label="Open lunge"
        onPress={() => {
          links.exercise('lunge');
        }}
      />
    </>
  );
}

async function renderPages() {
  rendered = await renderRouter(
    {
      _layout: Layout,
      'exercises/_layout': () => (
        <Stack screenOptions={{ headerShown: false }} />
      ),
      'exercises/index': () => <Text>Exercises list</Text>,
      'exercises/[id]': ExercisePage,
      'exercises/routine/[id]': RoutinePage,
    },
    { initialUrl: '/exercises/squat' },
  );
}

function stackSize() {
  const root = rendered.getRouterState();
  const exercises = (
    root?.routes[0]?.state as
      { routes: { name: string; state?: { routes: unknown[] } }[] } | undefined
  )?.routes.find((route) => route.name === 'exercises');

  return exercises?.state?.routes.length;
}

beforeEach(() => {
  queryClient = createTestQueryClient();
  queryClient.setQueryData(exerciseKeys.detail('squat'), { name: 'Squat' });
  queryClient.setQueryData(routineKeys.detail('legs'), { name: 'Legs' });
});

test('a link opens the page inside the tab, and its back link names where it came from', async () => {
  await renderPages();

  await fireEvent.press(screen.getByRole('button', { name: 'Open Legs' }));

  expect(await screen.findByText('Routine legs')).toBeOnTheScreen();
  expect(screen.getByRole('link', { name: 'Squat' })).toBeOnTheScreen();
});

test('opening a page already open further back goes back to it, never twice', async () => {
  await renderPages();
  const start = stackSize();
  expect(start).toEqual(expect.any(Number));
  await fireEvent.press(screen.getByRole('button', { name: 'Open Legs' }));
  await screen.findByText('Routine legs');

  await fireEvent.press(screen.getByRole('button', { name: 'Open squat' }));

  expect(await screen.findByText('Exercise squat')).toBeOnTheScreen();
  expect(stackSize()).toBe(start);
});

test('another page opens on top', async () => {
  await renderPages();
  await fireEvent.press(screen.getByRole('button', { name: 'Open Legs' }));
  await screen.findByText('Routine legs');

  await fireEvent.press(screen.getByRole('button', { name: 'Open lunge' }));

  expect(await screen.findByText('Exercise lunge')).toBeOnTheScreen();
  expect(screen.getByRole('link', { name: 'Legs' })).toBeOnTheScreen();
});

test('a back link shows a rename made on the way', async () => {
  await renderPages();
  await fireEvent.press(screen.getByRole('button', { name: 'Open Legs' }));
  await screen.findByText('Routine legs');

  await act(() => {
    queryClient.setQueryData(exerciseKeys.detail('squat'), {
      name: 'Back squat',
    });
  });

  expect(
    await screen.findByRole('link', { name: 'Back squat' }),
  ).toBeOnTheScreen();
});
