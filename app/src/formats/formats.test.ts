import {
  formatClock,
  formatSpokenDuration,
  formatSet,
  formatShortDate,
} from './formats';

test.each([
  [15, '0:15'],
  [90, '1:30'],
  [400, '6:40'],
  [600, '10:00'],
  [3599, '59:59'],
  [3600, '1:00:00'],
  [3990, '1:06:30'],
])('%i seconds on a clock read %s', (seconds, text) => {
  expect(formatClock(seconds)).toBe(text);
});

test.each([
  [15, '15 seconds'],
  [60, '1 minute'],
  [90, '1 minute 30 seconds'],
  [125, '2 minutes 5 seconds'],
  [1, '1 second'],
])('%i seconds are spoken as %s', (seconds, text) => {
  expect(formatSpokenDuration(seconds)).toBe(text);
});

test.each([
  [82.5, 10, 'metric', '82.5 kg × 10'],
  [15, 12, 'metric', '15 kg × 12'],
  [82.5, 10, 'imperial', '181.9 lb × 10'],
  [0, 10, 'metric', '10 reps'],
  [0, 1, 'imperial', '1 rep'],
] as const)(
  'a set of %d kg × %d in %s reads %s',
  (weightKg, reps, units, text) => {
    expect(formatSet(weightKg, reps, units)).toBe(text);
  },
);

test.each([
  ['2026-10-16', 'Fri, 16 Oct'],
  ['2026-10-19', 'Mon, 19 Oct'],
  ['2026-01-04', 'Sun, 4 Jan'],
])('the date %s reads %s', (date, text) => {
  expect(formatShortDate(date)).toBe(text);
});
