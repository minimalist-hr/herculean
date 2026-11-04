import { weekAfterSwipe } from './week-swipe';

const width = 358;

test.each([
  ['a long swipe left goes to the next week', -200, 0, 1],
  ['a long swipe right goes to the previous week', 200, 0, -1],
  ['a short swipe stays', -40, 0, 0],
  ['a quick flick left goes to the next week', -40, -0.8, 1],
  ['a quick flick right goes to the previous week', 40, 0.8, -1],
  ['a flick back against the swipe stays', -200, 0.8, 0],
])('%s', (_name, distance, velocity, week) => {
  expect(weekAfterSwipe({ distance, velocity, width })).toBe(week);
});
