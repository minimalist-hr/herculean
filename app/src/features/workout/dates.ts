import { dayNames, weekdays } from '@/features/routines/formats';

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** A date as the API reads it, for example "2026-10-25". */
export function dateText(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${String(date.getFullYear())}-${month}-${day}`;
}

export function dayNameOf(date: Date) {
  return dayNames[weekdays[(date.getDay() + 6) % 7]];
}

/** The seven days of a date's week, from Monday. */
export function weekOf(date: Date) {
  const monday = date.getDate() - ((date.getDay() + 6) % 7);

  return Array.from(
    { length: 7 },
    (_, index) => new Date(date.getFullYear(), date.getMonth(), monday + index),
  );
}

function ordinal(day: number) {
  const lastTwo = day % 100;
  if (lastTwo >= 11 && lastTwo <= 13) {
    return `${String(day)}th`;
  }

  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] ?? 'th';

  return `${String(day)}${suffix}`;
}

/** A date in words, for example "Sunday, 25th October". */
export function longDate(date: Date) {
  return `${dayNameOf(date).full}, ${ordinal(date.getDate())} ${months[date.getMonth()]}`;
}
