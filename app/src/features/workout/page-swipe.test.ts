import { isSidewaysSwipe, pageAfterSwipe } from './page-swipe';

const width = 358;

test.each([
  ['a long swipe left goes to the next week', -200, 0, 1],
  ['a long swipe right goes to the previous week', 200, 0, -1],
  ['a short swipe stays', -40, 0, 0],
  ['a quick flick left goes to the next week', -40, -0.8, 1],
  ['a quick flick right goes to the previous week', 40, 0.8, -1],
  ['a flick back against the swipe stays', -200, 0.8, 0],
])('%s', (_name, distance, velocity, week) => {
  expect(pageAfterSwipe({ distance, velocity, width })).toBe(week);
});

test.each([
  ['a clear swipe left', -40, 5, true],
  ['a clear swipe right', 40, -5, true],
  ['a small move', 10, 0, false],
  ['a scroll down', 2, 60, false],
  ['a scroll that drifts sideways', 30, 20, false],
])('%s', (_name, dx, dy, sideways) => {
  expect(isSidewaysSwipe(dx, dy)).toBe(sideways);
});
