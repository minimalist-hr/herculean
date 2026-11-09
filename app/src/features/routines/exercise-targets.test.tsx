import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme/theme-provider';

import { ExerciseTargets } from './exercise-targets';
import { groupBlocks } from './group-blocks';

function exercise(id: string, groupName: string, done?: string) {
  return {
    exerciseId: id,
    name: `Exercise ${id}`,
    groupId: groupName,
    groupName,
    targetSets: 3,
    targetRepsFrom: 8,
    targetRepsTo: 10,
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

test('a solo exercise keeps its group below its name', async () => {
  await renderTargets([exercise('a', 'Chest')]);

  expect(screen.getByText('3 × 8–10')).toBeOnTheScreen();
  expect(screen.getByText(/· Chest/)).toBeOnTheScreen();
});

test('connected exercises name their group once, up the stripe', async () => {
  await renderTargets([exercise('a', 'Chest'), exercise('b', 'Chest')]);

  expect(screen.getByText('Chest')).toBeOnTheScreen();
  expect(screen.queryByText(/· Chest/)).toBeNull();
});

test('each block has its own stripe, and a solo exercise between them has none', async () => {
  await renderTargets([
    exercise('a', 'Chest'),
    exercise('b', 'Chest'),
    exercise('c', 'Back'),
    exercise('d', 'Arms'),
    exercise('e', 'Arms'),
  ]);

  expect(screen.getByText('Chest')).toBeOnTheScreen();
  expect(screen.getByText('Arms')).toBeOnTheScreen();
  expect(screen.queryByText('Back')).toBeNull();
  expect(screen.getByText(/· Back/)).toBeOnTheScreen();
});

test('a saved exercise shows what was done instead of its target', async () => {
  await renderTargets([exercise('a', 'Chest', '3 sets · 990 kg')]);

  expect(screen.getByText('3 sets · 990 kg')).toBeOnTheScreen();
  expect(screen.queryByText('3 × 8–10')).toBeNull();
});

test('a long group name stays on one line', async () => {
  const name = 'A very long group name here';
  await renderTargets([exercise('a', name), exercise('b', name)]);

  expect(screen.getByText(name).props.numberOfLines).toBe(1);
});

test('only neighbours of the same group form a block', () => {
  const blocks = groupBlocks([
    { groupId: 'a' },
    { groupId: 'a' },
    { groupId: 'b' },
    { groupId: 'a' },
  ]);

  expect(blocks.map((block) => block.length)).toEqual([2, 1, 1]);
});
