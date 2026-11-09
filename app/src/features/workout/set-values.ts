import type { components } from '@/api/schema';
import { formatNumber, weightIn } from '@/formats/formats';

type Units = components['schemas']['Units'];

export type SetField = 'weight' | 'reps';

const poundsPerKg = 2.20462;
const maxWeightKg = 1000;
const maxReps = 100;

/** An exercise's limit, the same as the API's. */
export const maxSetsPerExercise = 20;

/** A workout's limit, the same as the API's. */
export const maxExercisesPerWorkout = 30;

const decimalsOf = (field: SetField, units: Units) => {
  if (field === 'reps') {
    return 0;
  }

  return units === 'metric' ? 2 : 1;
};

/** What one keypad press makes of a value. The first press after opening or a step replaces it. */
export function pressKey(
  value: string,
  key: string,
  { fresh, field, units }: { fresh: boolean; field: SetField; units: Units },
) {
  if (key === 'back') {
    return fresh ? '' : value.slice(0, -1);
  }

  const start = fresh ? '' : value;
  if (key === '.') {
    if (decimalsOf(field, units) === 0 || start.includes('.')) {
      return value;
    }

    return `${start === '' ? '0' : start}.`;
  }

  const next = start === '0' ? key : start + key;
  const [whole, decimals = ''] = next.split('.');
  const tooLong =
    whole.length > (field === 'reps' ? 3 : 4) ||
    decimals.length > decimalsOf(field, units);

  return tooLong ? value : next;
}

/** A step's size in the value's unit: 2.5 kg, 5 lb or 1 rep. */
export function stepOf(field: SetField, units: Units) {
  if (field === 'reps') {
    return 1;
  }

  return units === 'metric' ? 2.5 : 5;
}

function limitsOf(field: SetField, units: Units) {
  return field === 'reps'
    ? { min: 1, max: maxReps }
    : { min: 0, max: weightIn(maxWeightKg, units) };
}

/** A value one step up or down, kept within its limits. */
export function stepValue(
  value: string,
  direction: 1 | -1,
  field: SetField,
  units: Units,
) {
  const { min, max } = limitsOf(field, units);
  const stepped = Number(value) + direction * stepOf(field, units);
  const rounded = Math.round(stepped * 100) / 100;

  return String(Math.min(max, Math.max(min, rounded)));
}

/** Why a value can't be saved, or null when it can. */
export function problemWith(value: string, field: SetField, units: Units) {
  const { min, max } = limitsOf(field, units);
  const number = Number(value);
  if (number >= min && number <= max) {
    return null;
  }

  return field === 'reps'
    ? `Reps are ${String(min)} to ${String(max)}.`
    : `Weight is ${String(min)} to ${formatNumber(max)} ${units === 'metric' ? 'kg' : 'lb'}.`;
}

/** A weight in the user's units, as the API stores it: kg with two decimals. */
export function toKg(weight: number, units: Units) {
  return units === 'metric'
    ? weight
    : Math.round((weight / poundsPerKg) * 100) / 100;
}
