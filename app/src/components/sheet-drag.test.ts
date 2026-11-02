import { closesAfterDrag } from './sheet-drag';

test('a short pull down springs back', () => {
  expect(closesAfterDrag({ height: 500, pulledDown: 100, velocity: 0 })).toBe(
    false,
  );
});

test('a long pull down closes it', () => {
  expect(closesAfterDrag({ height: 500, pulledDown: 200, velocity: 0 })).toBe(
    true,
  );
});

test('a quick flick down closes it, however short', () => {
  expect(closesAfterDrag({ height: 500, pulledDown: 20, velocity: 1 })).toBe(
    true,
  );
});

test('a flick up does not close it', () => {
  expect(closesAfterDrag({ height: 500, pulledDown: 0, velocity: -1 })).toBe(
    false,
  );
});
