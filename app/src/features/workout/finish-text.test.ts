import { discardMessage, finishWarning, recordReason } from './finish-text';

const base = {
  name: 'Legs',
  date: '2026-11-03',
  durationSeconds: 60,
  volumeKg: 100,
  records: [],
};

function unchecked(...exercises: [string, number, number][]) {
  const missing = exercises.reduce((sum, [, count]) => sum + count, 0);

  return {
    ...base,
    setsChecked: 5,
    setsTotal: 5 + missing,
    uncheckedExercises: exercises.map(([name, uncheckedSets, sets]) => ({
      name,
      uncheckedSets,
      sets,
    })),
  };
}

const later = "They won't be saved unless you go back and log them.";

test.each([
  ['some of the sets', ['Squat', 2, 3], `Squat, 2 sets. ${later}`],
  ['both of two sets', ['Squat', 2, 2], `Squat, both sets. ${later}`],
  ['all of many sets', ['Squat', 4, 4], `Squat, all 4 sets. ${later}`],
] as const)('one exercise names %s', (_name, exercise, message) => {
  expect(finishWarning(unchecked([...exercise]))?.message).toBe(message);
});

test('a single set reads as one', () => {
  const warning = finishWarning(unchecked(['Squat', 1, 1]));

  expect(warning?.title).toBe('1 set not checked off');
  expect(warning?.message).toBe(
    "Squat, 1 set. It won't be saved unless you go back and log it.",
  );
});

test('two exercises are named', () => {
  expect(
    finishWarning(unchecked(['Squat', 1, 3], ['Press', 2, 3]))?.message,
  ).toBe(`Squat and Press. ${later}`);
});

test('more than two exercises are counted', () => {
  expect(
    finishWarning(unchecked(['Squat', 1, 3], ['Press', 1, 3], ['Curl', 1, 3]))
      ?.message,
  ).toBe(`Across 3 exercises. ${later}`);
});

test('every set checked has no warning', () => {
  expect(finishWarning(unchecked())).toBeNull();
});

test('nothing checked says there is nothing to save', () => {
  expect(
    finishWarning({ ...unchecked(), setsChecked: 0, setsTotal: 0 })?.title,
  ).toBe('No sets checked off');
});

test.each([
  [0, 'No sets are checked off. You can undo this right after.'],
  [1, "Its 1 checked set won't be saved. You can undo this right after."],
  [17, "Its 17 checked sets won't be saved. You can undo this right after."],
])('discarding with %i checked sets', (sets, message) => {
  expect(discardMessage(sets)).toBe(message);
});

test.each([
  ['heaviestWeight', 85, 'Heaviest weight'],
  ['mostReps', 30, 'Most reps at 30 kg'],
  ['mostReps', 0, 'Most reps'],
] as const)('a %s record at %i kg', (kind, weightKg, reason) => {
  expect(
    recordReason(
      { name: 'Squat', kind, weightKg, reps: 8 },
      `${String(weightKg)} kg`,
    ),
  ).toBe(reason);
});
