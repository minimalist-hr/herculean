import { formatClock, formatSpokenDuration } from './formats';

test.each([
  [15, '0:15'],
  [90, '1:30'],
  [400, '6:40'],
  [600, '10:00'],
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
