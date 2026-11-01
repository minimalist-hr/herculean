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

/** A time as minutes and seconds, for example 90 → "1:30". Used for rest times and the elapsed time while logging. */
export function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
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

/** A date from the API, for example "2026-10-16" → "Fri, 16 Oct". */
export function formatShortDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return `${weekdays[(utc.getUTCDay() + 6) % 7]}, ${String(day)} ${months[month - 1]}`;
}

function formatWeight(weightKg: number, units: Units) {
  return units === 'metric'
    ? `${String(weightKg)} kg`
    : `${String(Math.round(weightKg * poundsPerKg * 10) / 10)} lb`;
}

function plural(count: number, unit: string) {
  return `${String(count)} ${unit}${count === 1 ? '' : 's'}`;
}
