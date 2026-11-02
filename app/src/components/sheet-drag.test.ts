import { snapAfterDrag } from './sheet-drag';

const base = { rest: 500, full: 800, velocity: 0 };

test('a short pull down springs back to its resting height', () => {
  expect(snapAfterDrag({ ...base, height: 500, pulledDown: 100 })).toBe('rest');
});

test('a long pull down closes it', () => {
  expect(snapAfterDrag({ ...base, height: 500, pulledDown: 200 })).toBe(
    'close',
  );
});

test('a quick flick down closes it, however short', () => {
  expect(
    snapAfterDrag({ ...base, height: 500, pulledDown: 20, velocity: 1 }),
  ).toBe('close');
});

test('it goes to whichever height is nearest', () => {
  expect(snapAfterDrag({ ...base, height: 700, pulledDown: 0 })).toBe('full');
  expect(snapAfterDrag({ ...base, height: 600, pulledDown: 0 })).toBe('rest');
});

test('a quick flick wins over the nearest height', () => {
  expect(
    snapAfterDrag({ ...base, height: 520, pulledDown: 0, velocity: -1 }),
  ).toBe('full');
  expect(
    snapAfterDrag({ ...base, height: 780, pulledDown: 0, velocity: 1 }),
  ).toBe('rest');
});

test('content that fits never goes to full screen', () => {
  expect(
    snapAfterDrag({
      rest: 500,
      full: 500,
      height: 500,
      pulledDown: 0,
      velocity: -1,
    }),
  ).toBe('rest');
});
