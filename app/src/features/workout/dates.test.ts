import {
  addDays,
  dateFromText,
  dateText,
  dayHeading,
  daysFrom,
  shortWeekdayDate,
  shortDate,
} from './dates';

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

test('adds days across a month', () => {
  expect(dateText(addDays(new Date(2026, 10, 25), 7))).toBe('2026-12-02');
});

test('a short date reads correctly', () => {
  expect(shortDate(new Date(2026, 9, 26))).toBe('Mon, 26th Oct');
});

test.each([
  ['2026-11-03', 0],
  ['2026-11-04', 1],
  ['2026-11-02', -1],
  ['2026-12-01', 28],
])('%s is %i days from today', (date, days) => {
  expect(daysFrom('2026-11-03', date)).toBe(days);
});

test('reads a date in the local time zone', () => {
  expect(dateText(dateFromText('2026-11-03'))).toBe('2026-11-03');
});
