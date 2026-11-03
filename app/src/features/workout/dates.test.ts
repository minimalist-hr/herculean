import { longDate } from './dates';

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
