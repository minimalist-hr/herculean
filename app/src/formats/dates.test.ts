import { addDays, dateFromText, dateText, daysFrom } from './dates';

test('adds days across a month', () => {
  expect(dateText(addDays(new Date(2026, 10, 25), 7))).toBe('2026-12-02');
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
