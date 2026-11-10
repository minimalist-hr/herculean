import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme/theme-provider';

import { ExerciseTargets } from './exercise-targets';
import { supersetBlocks } from './superset-blocks';

function exercise(
  id: string,
  groupName: string,
  {
    done,
    supersetWithNext = false,
  }: { done?: string; supersetWithNext?: boolean } = {},
) {
  return {
    exerciseId: id,
    name: `Exercise ${id}`,
    groupId: groupName,
    groupName,
    targetSets: 3,
    targetRepsFrom: 8,
    targetRepsTo: 10,
    supersetWithNext,
    done,
  };
}

async function renderTargets(exercises: ReturnType<typeof exercise>[]) {
  await render(
    <ThemeProvider theme="dark">
      <ExerciseTargets exercises={exercises} />
    </ThemeProvider>,
  );
}

test('every exercise keeps its group below its name', async () => {
  await renderTargets([
    exercise('a', 'Chest', { supersetWithNext: true }),
    exercise('b', 'Back'),
  ]);

  expect(screen.getByText(/· Chest/)).toBeOnTheScreen();
  expect(screen.getByText(/· Back/)).toBeOnTheScreen();
});

test('a superset is one block, named up its stripe', async () => {
  await renderTargets([
    exercise('a', 'Chest', { supersetWithNext: true }),
    exercise('b', 'Back'),
  ]);

  expect(screen.getByText('Superset')).toBeOnTheScreen();
});

test('neighbours of the same group no longer join', async () => {
  await renderTargets([exercise('a', 'Chest'), exercise('b', 'Chest')]);

  expect(screen.queryByText('Superset')).toBeNull();
});

test('a saved exercise shows what was done instead of its target', async () => {
  await renderTargets([exercise('a', 'Chest', { done: '3 sets · 990 kg' })]);

  expect(screen.getByText('3 sets · 990 kg')).toBeOnTheScreen();
  expect(screen.queryByText('3 × 8–10')).toBeNull();
});

test('only an exercise and the one after it form a block', () => {
  const blocks = supersetBlocks([
    { supersetWithNext: true },
    { supersetWithNext: false },
    { supersetWithNext: false },
    { supersetWithNext: true },
  ]);

  expect(blocks.map((block) => block.length)).toEqual([2, 1, 1]);
});
