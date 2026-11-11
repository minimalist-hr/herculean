import {
  counted,
  dayHeading,
  formatClock,
  formatLastTime,
  formatNumber,
  formatSpokenDuration,
  formatSet,
  formatShortDate,
  formatSince,
  hoursAndMinutesText,
  joined,
  minutesText,
  monthTitle,
  shortWeekdayDate,
  targetText,
} from './formats';

test.each([
  [1, 'Sun, 1st November'],
  [2, 'Mon, 2nd November'],
  [3, 'Tue, 3rd November'],
  [4, 'Wed, 4th November'],
  [11, 'Wed, 11th November'],
  [12, 'Thu, 12th November'],
  [13, 'Fri, 13th November'],
  [21, 'Sat, 21st November'],
  [22, 'Sun, 22nd November'],
  [23, 'Mon, 23rd November'],
  [30, 'Mon, 30th November'],
])('the %ith of the month reads correctly', (day, words) => {
  expect(shortWeekdayDate(new Date(2026, 10, day))).toBe(words);
});

test('a day in another year says the year', () => {
  expect(dayHeading(new Date(2025, 2, 3), '2026-11-03').label).toBe(
    '3rd March 2025',
  );
});

test('a day this year leaves the year out', () => {
  expect(dayHeading(new Date(2026, 2, 3), '2026-11-03').label).toBe(
    '3rd March',
  );
});

test('a day next to today is named', () => {
  expect(dayHeading(new Date(2026, 10, 4), '2026-11-03')).toEqual({
    label: 'Wed, 4th November',
    title: 'Tomorrow',
  });
});

test('a month reads with its year', () => {
  expect(monthTitle('2026-10')).toBe('October 2026');
});

test.each([
  [1, '1 set'],
  [19, '19 sets'],
])('%i reads %s', (count, text) => {
  expect(counted(count, 'set', 'sets')).toBe(text);
});

test.each([
  [['Legs'], 'Legs'],
  [['Legs', 'Arms'], 'Legs and Arms'],
  [['Legs', 'Arms', 'Back'], 'Legs, Arms and Back'],
])('%j reads %s', (words, text) => {
  expect(joined(words)).toBe(text);
});

test('a large number has separators', () => {
  expect(formatNumber(9840)).toBe('9,840');
});

test.each([
  [3, 8, 10, '3 × 8–10'],
  [4, 6, 6, '4 × 6'],
])('a target of %i sets, %i to %i reps reads %s', (sets, from, to, text) => {
  expect(
    targetText({ targetSets: sets, targetRepsFrom: from, targetRepsTo: to }),
  ).toBe(text);
});

test('a duration reads in whole minutes', () => {
  expect(minutesText(3850)).toBe('64 min');
});

test.each([
  [45, '45 min'],
  [793, '13 h 13 min'],
])('%i minutes in total read %s', (minutes, text) => {
  expect(hoursAndMinutesText(minutes)).toBe(text);
});

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

describe('in 2026', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 10, 6) });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test.each([
    ['2026-10-16', 'Fri, 16th Oct'],
    ['2026-10-22', 'Thu, 22nd Oct'],
    ['2026-01-01', 'Thu, 1st Jan'],
    ['2026-01-13', 'Tue, 13th Jan'],
    ['2023-10-16', 'Mon, 16th Oct 2023'],
  ])('the date %s reads %s', (date, text) => {
    expect(formatShortDate(date)).toBe(text);
  });

  test.each([
    ['2026-08-07', 'Since 7th Aug'],
    ['2021-03-03', 'Since 3rd Mar 2021'],
  ])('a run starting %s reads %s', (date, text) => {
    expect(formatSince(date)).toBe(text);
  });
});

test('a set from last time says when lengthened partials followed it', () => {
  expect(formatLastTime(80, 10, 'metric', true)).toBe('80 × 10 + LP');
  expect(formatLastTime(0, 12, 'metric', true)).toBe('12 reps + LP');
  expect(formatLastTime(80, 10, 'metric')).toBe('80 × 10');
});
