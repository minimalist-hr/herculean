import {
  blockAt,
  goesOnToSecond,
  nextSupersetSet,
  withoutExercise,
} from './superset-blocks';

function exercise(supersetWithNext: boolean, ...checked: boolean[]) {
  return {
    supersetWithNext,
    sets: checked.map((value, index) => ({
      id: `${String(supersetWithNext)}-${String(index)}`,
      checked: value,
    })),
  };
}

test('a superset is two exercises, wherever one of them is', () => {
  const exercises = [exercise(true), exercise(false), exercise(false)];

  expect(blockAt(exercises, 0)).toEqual([0, 1]);
  expect(blockAt(exercises, 1)).toEqual([0, 1]);
  expect(blockAt(exercises, 2)).toEqual([2]);
});

test('a last exercise marked for a superset stands alone', () => {
  expect(blockAt([exercise(true)], 0)).toEqual([0]);
});

test('the next set takes a set of each in turn, and one with more sets goes on alone', () => {
  const first = exercise(true, true, false, false);
  const second = exercise(false, false);

  expect(nextSupersetSet([first, second])).toBe(second.sets[0].id);
  expect(
    nextSupersetSet([first, { ...second, sets: [{ id: 'x', checked: true }] }]),
  ).toBe(first.sets[1].id);
  expect(nextSupersetSet([exercise(true, true), exercise(false, true)])).toBe(
    undefined,
  );
});

test('the first exercise goes on to the second while it has that set to do', () => {
  expect(goesOnToSecond(exercise(true), 0, exercise(false, false))).toBe(true);
  expect(goesOnToSecond(exercise(true), 0, exercise(false, true))).toBe(false);
  expect(goesOnToSecond(exercise(true), 1, exercise(false, false))).toBe(false);
  expect(goesOnToSecond(exercise(false), 0, exercise(false, false))).toBe(
    false,
  );
});

test('removing the second of a superset ends it, and removing the first takes it along', () => {
  const exercises = [exercise(true), exercise(false), exercise(false)];

  expect(
    withoutExercise(exercises, 1).map((item) => item.supersetWithNext),
  ).toEqual([false, false]);
  expect(
    withoutExercise(exercises, 0).map((item) => item.supersetWithNext),
  ).toEqual([false, false]);
});
