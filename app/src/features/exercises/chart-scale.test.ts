import { dayNumber, monthLabels, weightTicks } from './chart-scale';

test('weight ticks are round numbers around every value, at most three gaps apart', () => {
  expect(weightTicks([70, 72.5, 82.5])).toEqual([70, 75, 80, 85]);
  expect(weightTicks([100, 140])).toEqual([100, 120, 140]);
});

test('a flat line gets a gap above it', () => {
  expect(weightTicks([0, 0])).toEqual([0, 0.5]);
  expect(weightTicks([80])).toEqual([80, 80.5]);
});

test('day numbers space dates by time', () => {
  expect(dayNumber('2026-10-16') - dayNumber('2026-10-09')).toBe(7);
});

test('month labels mark where each month starts', () => {
  expect(
    monthLabels('2026-08-07', '2026-10-16').map((month) => month.label),
  ).toEqual(['Sep', 'Oct']);
});

test('a range inside one month names it', () => {
  expect(monthLabels('2026-10-02', '2026-10-16')).toEqual([
    { day: dayNumber('2026-10-02'), label: 'Oct' },
  ]);
});

test('over a year, the labels are years, at most four', () => {
  const labels = monthLabels('2021-03-01', '2026-10-16');

  expect(labels.length).toBeLessThanOrEqual(4);
  expect(labels.map((month) => month.label)).toContain('2022');
});
