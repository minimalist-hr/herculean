import { minutesText, savedMeta } from './saved-workout';

const summary = {
  name: 'Legs',
  date: '2026-11-03',
  durationSeconds: 3850,
  setsChecked: 17,
  setsTotal: 17,
  volumeKg: 100,
  uncheckedExercises: [],
  records: [],
};

test('a duration rounds to whole minutes', () => {
  expect(minutesText(3850)).toBe('64 min');
});

test('the line names exercises, sets and time', () => {
  expect(savedMeta(6, summary)).toBe('6 exercises · 17 sets · 64 min');
});

test('a past day logged later has no time', () => {
  expect(savedMeta(1, { ...summary, durationSeconds: null })).toBe(
    '1 exercise · 17 sets',
  );
});

test('while it loads, only the exercises are known', () => {
  expect(savedMeta(6)).toBe('6 exercises');
});
