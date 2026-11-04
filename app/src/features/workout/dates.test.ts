import { dateFromText, dateText, daysFrom, longDate, shortDate } from './dates';

test.each([
  [1, 'Sunday, 1st November'],
  [2, 'Monday, 2nd November'],
  [3, 'Tuesday, 3rd November'],
  [4, 'Wednesday, 4th November'],
  [11, 'Wednesday, 11th November'],
  [12, 'Thursday, 12th November'],
  [13, 'Friday, 13th November'],
  [21, 'Saturday, 21st November'],
  [22, 'Sunday, 22nd November'],
  [23, 'Monday, 23rd November'],
  [30, 'Monday, 30th November'],
])('the %ith of the month reads correctly', (day, words) => {
  expect(longDate(new Date(2026, 10, day))).toBe(words);
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
