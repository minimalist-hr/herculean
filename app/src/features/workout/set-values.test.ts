import { weightIn } from '@/formats/formats';

import { pressKey, problemWith, stepOf, stepValue, toKg } from './set-values';

const weight = { field: 'weight', units: 'metric' } as const;
const pounds = { field: 'weight', units: 'imperial' } as const;
const reps = { field: 'reps', units: 'metric' } as const;

describe('the keypad', () => {
  test('the first key replaces the value', () => {
    expect(pressKey('82.5', '9', { ...weight, fresh: true })).toBe('9');
  });

  test('later keys add to it', () => {
    expect(pressKey('9', '5', { ...weight, fresh: false })).toBe('95');
  });

  test('a first point starts from zero', () => {
    expect(pressKey('82.5', '.', { ...weight, fresh: true })).toBe('0.');
  });

  test('a value has one point', () => {
    expect(pressKey('82.5', '.', { ...weight, fresh: false })).toBe('82.5');
  });

  test('a leading zero goes away', () => {
    expect(pressKey('0', '7', { ...weight, fresh: false })).toBe('7');
  });

  test('kg take two decimals and pounds one', () => {
    expect(pressKey('82.25', '5', { ...weight, fresh: false })).toBe('82.25');
    expect(pressKey('82.2', '5', { ...weight, fresh: false })).toBe('82.25');
    expect(pressKey('82.5', '5', { ...pounds, fresh: false })).toBe('82.5');
  });

  test('reps are whole numbers', () => {
    expect(pressKey('10', '.', { ...reps, fresh: false })).toBe('10');
  });

  test('a value stops at its length', () => {
    expect(pressKey('100', '0', { ...reps, fresh: false })).toBe('100');
    expect(pressKey('1000', '0', { ...weight, fresh: false })).toBe('1000');
  });

  test('delete removes the last character, and everything when first', () => {
    expect(pressKey('82.5', 'back', { ...weight, fresh: false })).toBe('82.');
    expect(pressKey('82.5', 'back', { ...weight, fresh: true })).toBe('');
  });
});

describe('the steps', () => {
  test('are 2.5 kg, 5 lb and 1 rep', () => {
    expect(stepOf('weight', 'metric')).toBe(2.5);
    expect(stepOf('weight', 'imperial')).toBe(5);
    expect(stepOf('reps', 'metric')).toBe(1);
  });

  test('move the value', () => {
    expect(stepValue('82.5', 1, 'weight', 'metric')).toBe('85');
    expect(stepValue('8', -1, 'reps', 'metric')).toBe('7');
  });

  test('stay within the limits', () => {
    expect(stepValue('1', -1, 'weight', 'metric')).toBe('0');
    expect(stepValue('999', 1, 'weight', 'metric')).toBe('1000');
    expect(stepValue('1', -1, 'reps', 'metric')).toBe('1');
    expect(stepValue('100', 1, 'reps', 'metric')).toBe('100');
  });
});

describe('a value can be saved', () => {
  test.each([
    ['0', 'weight'],
    ['1000', 'weight'],
    ['1', 'reps'],
    ['100', 'reps'],
  ] as const)('%s as %s', (value, field) => {
    expect(problemWith(value, field, 'metric')).toBeNull();
  });

  test('empty weight counts as bodyweight', () => {
    expect(problemWith('', 'weight', 'metric')).toBeNull();
  });

  test('says why it can not', () => {
    expect(problemWith('1001', 'weight', 'metric')).toBe('At most 1,000 kg.');
    expect(problemWith('3000', 'weight', 'imperial')).toBe(
      'At most 2,204.6 lb.',
    );
    expect(problemWith('0', 'reps', 'metric')).toBe('At least 1 rep.');
    expect(problemWith('', 'reps', 'metric')).toBe('At least 1 rep.');
    expect(problemWith('101', 'reps', 'metric')).toBe('At most 100 reps.');
  });
});

describe('pounds become kg', () => {
  test('with two decimals', () => {
    expect(toKg(185, 'imperial')).toBe(83.91);
  });

  test('and read back the same', () => {
    expect(weightIn(toKg(185.5, 'imperial'), 'imperial')).toBe(185.5);
  });

  test('kg stay as they are', () => {
    expect(toKg(82.5, 'metric')).toBe(82.5);
  });
});
