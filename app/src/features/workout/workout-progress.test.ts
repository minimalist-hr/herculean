import type { components } from '@/api/schema';

import {
  checkedSets,
  isFinished,
  nextUnfinished,
  progressText,
  workoutProgress,
} from './workout-progress';

type WorkoutExercise = components['schemas']['WorkoutExerciseResponse'];

function exercise(id: string, ...checked: boolean[]): WorkoutExercise {
  return {
    id,
    exerciseId: `${id}-exercise`,
    name: id,
    groupId: 'group',
    groupName: 'Group',
    targetSets: checked.length,
    targetRepsFrom: 8,
    targetRepsTo: 10,
    exists: true,
    supersetWithNext: false,
    sets: checked.map((value, order) => ({
      id: `${id}-${String(order)}`,
      order,
      weightKg: 0,
      reps: 8,
      checked: value,
    })),
    lastTime: null,
  };
}

test('counts the checked sets of an exercise', () => {
  expect(checkedSets(exercise('a', true, false, true))).toBe(2);
});

test('an exercise is finished when every set is checked', () => {
  expect(isFinished(exercise('a', true, true))).toBe(true);
  expect(isFinished(exercise('a', true, false))).toBe(false);
});

test('counts the whole workout', () => {
  const progress = workoutProgress([
    exercise('a', true, true),
    exercise('b', true, false, false),
  ]);

  expect(progress).toEqual({ done: 3, total: 5 });
  expect(progressText(progress)).toBe('3 of 5 sets');
});

describe('the next exercise to open', () => {
  test('is the next unfinished one', () => {
    const exercises = [
      exercise('a', true),
      exercise('b', true),
      exercise('c', false),
    ];

    expect(nextUnfinished(exercises, 'a')?.id).toBe('c');
  });

  test('goes back to an earlier one when nothing later is unfinished', () => {
    const exercises = [exercise('a', false), exercise('b', true)];

    expect(nextUnfinished(exercises, 'b')?.id).toBe('a');
  });

  test('is none when everything is finished', () => {
    expect(nextUnfinished([exercise('a', true)], 'a')).toBeUndefined();
  });
});
