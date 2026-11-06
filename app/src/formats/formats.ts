import type { components } from '@/api/schema';

// Every format the app shows, from design section 8, is defined here and nowhere else.

type Units = components['schemas']['Units'];

const poundsPerKg = 2.20462;
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** A time as minutes and seconds, with hours once it has any, for example 90 → "1:30" and 3990 → "1:06:30". Used for rest times and the elapsed time while logging. */
export function formatClock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return hours > 0
    ? `${String(hours)}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${String(Math.floor(totalSeconds / 60))}:${seconds}`;
}

/** The same time in words, for screen readers, for example 90 → "1 minute 30 seconds". */
export function formatSpokenDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const parts = [
    minutes > 0 ? plural(minutes, 'minute') : '',
    seconds > 0 || minutes === 0 ? plural(seconds, 'second') : '',
  ];
  return parts.filter((part) => part !== '').join(' ');
}

/** A set, for example "82.5 kg × 10", or "10 reps" for a bodyweight set. */
export function formatSet(weightKg: number, reps: number, units: Units) {
  return weightKg === 0
    ? plural(reps, 'rep')
    : `${formatWeight(weightKg, units)} × ${String(reps)}`;
}

/** A set from last time, for example "82.5 × 10", or "10 reps" for a bodyweight set. The column already names the unit. */
export function formatLastTime(weightKg: number, reps: number, units: Units) {
  return weightKg === 0
    ? plural(reps, 'rep')
    : `${String(weightIn(weightKg, units))} × ${String(reps)}`;
}

/** A weight as a number in the user's units. Pounds round to 0.1. */
export function weightIn(weightKg: number, units: Units) {
  return units === 'metric'
    ? weightKg
    : Math.round(weightKg * poundsPerKg * 10) / 10;
}

export function weightUnitOf(units: Units) {
  return units === 'metric' ? 'kg' : 'lb';
}

/** A total weight, for example "9,840 kg". */
export function formatVolume(weightKg: number, units: Units) {
  return `${Math.round(weightIn(weightKg, units)).toLocaleString('en-US')} ${weightUnitOf(units)}`;
}

/** A date from the API, for example "2026-10-16" → "Fri, 16th Oct". Another year says which: "Fri, 16th Oct 2023". */
export function formatShortDate(date: string) {
  const utc = utcDateOf(date);
  return `${weekdays[(utc.getUTCDay() + 6) % 7]}, ${dayAndMonth(utc)}`;
}

/** Where a run of dates starts, for example "Since 7th Aug". Another year says which. */
export function formatSince(date: string) {
  return `Since ${dayAndMonth(utcDateOf(date))}`;
}

/** A day of the month, for example "16th". */
export function ordinal(day: number) {
  const lastTwo = day % 100;
  if (lastTwo >= 11 && lastTwo <= 13) {
    return `${String(day)}th`;
  }

  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] ?? 'th';

  return `${String(day)}${suffix}`;
}

export function formatWeight(weightKg: number, units: Units) {
  return `${String(weightIn(weightKg, units))} ${weightUnitOf(units)}`;
}

function utcDateOf(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function dayAndMonth(utc: Date) {
  const year = utc.getUTCFullYear();
  return [
    ordinal(utc.getUTCDate()),
    months[utc.getUTCMonth()],
    ...(year === new Date().getFullYear() ? [] : [String(year)]),
  ].join(' ');
}

function plural(count: number, unit: string) {
  return `${String(count)} ${unit}${count === 1 ? '' : 's'}`;
}
