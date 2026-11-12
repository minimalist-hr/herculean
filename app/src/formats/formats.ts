import type { components } from '@/api/schema';

import { dateFromText, dateText, daysFrom } from './dates';

// Every format the app shows, from design section 8, is defined here and nowhere else.

type Units = components['schemas']['Units'];
export type Weekday = components['schemas']['Weekday'];
type DayStatus = components['schemas']['DayStatus'];

const poundsPerKg = 2.20462;

export const dayNames: Record<Weekday, { full: string; short: string }> = {
  monday: { full: 'Monday', short: 'Mon' },
  tuesday: { full: 'Tuesday', short: 'Tue' },
  wednesday: { full: 'Wednesday', short: 'Wed' },
  thursday: { full: 'Thursday', short: 'Thu' },
  friday: { full: 'Friday', short: 'Fri' },
  saturday: { full: 'Saturday', short: 'Sat' },
  sunday: { full: 'Sunday', short: 'Sun' },
};

export const weekdays = Object.keys(dayNames) as Weekday[];

const monthNames = [
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

export const shortMonthNames = monthNames.map((name) => name.slice(0, 3));

/** Shown for a value there is nothing to work out from yet. */
export const noValue = '–';

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
    minutes > 0 ? counted(minutes, 'minute', 'minutes') : '',
    seconds > 0 || minutes === 0 ? counted(seconds, 'second', 'seconds') : '',
  ];
  return parts.filter((part) => part !== '').join(' ');
}

/** A set, for example "82.5 kg × 10", or "10 reps" for a bodyweight set. */
export function formatSet(weightKg: number, reps: number, units: Units) {
  return weightKg === 0
    ? counted(reps, 'rep', 'reps')
    : `${formatWeight(weightKg, units)} × ${String(reps)}`;
}

/** A set from last time, for example "82.5 × 10", "82.5 × 10 + LP" with lengthened partials, or "10 reps" for a bodyweight set. The column already names the unit. */
export function formatLastTime(
  weightKg: number,
  reps: number,
  units: Units,
  partialsDone = false,
) {
  const set =
    weightKg === 0
      ? counted(reps, 'rep', 'reps')
      : `${String(weightIn(weightKg, units))} × ${String(reps)}`;

  return partialsDone ? `${set} + LP` : set;
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
  return `${formatNumber(Math.round(weightIn(weightKg, units)))} ${weightUnitOf(units)}`;
}

/** A total weight for a small space: "12.4 t" or "27.3k lb" from a thousand up. */
export function formatCompactVolume(weightKg: number, units: Units) {
  const weight = weightIn(weightKg, units);
  if (weight < 1000) {
    return formatVolume(weightKg, units);
  }

  const thousands = (weight / 1000).toFixed(1);

  return units === 'metric' ? `${thousands} t` : `${thousands}k lb`;
}

/** A date from the API, for example "2026-10-16" → "Fri, 16th Oct". Another year says which: "Fri, 16th Oct 2023". */
export function formatShortDate(date: string) {
  const utc = utcDateOf(date);
  return `${dayNames[weekdays[(utc.getUTCDay() + 6) % 7]].short}, ${dayAndMonth(utc)}`;
}

/** The day of a moment from the API, in the phone's time, for example "Fri, 16th Oct". */
export function formatLocalDate(moment: string) {
  return formatShortDate(dateText(new Date(moment)));
}

/** A moment from the API, in the phone's time, for example "Fri, 16th Oct, 14:05". */
export function formatDateTime(moment: string) {
  const local = new Date(moment);
  const hours = String(local.getHours()).padStart(2, '0');
  const minutes = String(local.getMinutes()).padStart(2, '0');

  return `${formatShortDate(dateText(local))}, ${hours}:${minutes}`;
}

/**
 * How long ago a moment was, for example "Just now", "5 minutes ago", "2 hours ago" or "Yesterday, 14:05".
 * Before yesterday it is the date and time.
 */
export function formatRelativeTime(moment: string, now: Date) {
  const then = new Date(moment);
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000);
  const today = dateText(now);
  const time = formatDateTime(moment).split(', ').at(-1) ?? '';

  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${counted(minutes, 'minute', 'minutes')} ago`;
  }
  if (dateText(then) === today) {
    return `${counted(Math.floor(minutes / 60), 'hour', 'hours')} ago`;
  }
  if (daysFrom(dateText(then), today) === 1) {
    return `Yesterday, ${time}`;
  }

  return formatDateTime(moment);
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
    shortMonthNames[utc.getUTCMonth()],
    ...(year === new Date().getFullYear() ? [] : [String(year)]),
  ].join(' ');
}

/** A count with its word, for example "1 set" or "19 sets". */
export function counted(count: number, one: string, many: string) {
  return `${String(count)} ${count === 1 ? one : many}`;
}

/** Words in a sentence, for example "Legs, Arms and Back". */
export function joined(words: string[]) {
  return words.length < 2
    ? words.join('')
    : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** A large number, for example "9,840". */
export function formatNumber(value: number) {
  return value.toLocaleString('en-US');
}

/** A target, for example "3 × 8–10", or "4 × 6" for a fixed rep count. */
export function targetText({
  targetSets,
  targetRepsFrom,
  targetRepsTo,
}: {
  targetSets: number;
  targetRepsFrom: number;
  targetRepsTo: number;
}) {
  const reps =
    targetRepsFrom === targetRepsTo
      ? String(targetRepsFrom)
      : `${String(targetRepsFrom)}–${String(targetRepsTo)}`;

  return `${String(targetSets)} × ${reps}`;
}

/** A duration in whole minutes, for example "64 min". */
export function minutesText(durationSeconds: number) {
  return `${String(Math.round(durationSeconds / 60))} min`;
}

/** A long total of minutes, for example "45 min" or "13 h 13 min". */
export function hoursAndMinutesText(minutes: number) {
  const hours = Math.floor(minutes / 60);

  return hours === 0
    ? `${String(minutes)} min`
    : `${String(hours)} h ${String(minutes % 60)} min`;
}

export function dayNameOf(date: Date) {
  return dayNames[weekdays[(date.getDay() + 6) % 7]];
}

export function monthName(date: Date) {
  return monthNames[date.getMonth()];
}

/** A month in words, for example "October 2026". */
export function monthTitle(month: string) {
  const first = dateFromText(`${month}-01`);

  return `${monthName(first)} ${String(first.getFullYear())}`;
}

/** A date with a short weekday, for example "Sun, 25th October". */
export function shortWeekdayDate(date: Date) {
  return `${dayNameOf(date).short}, ${ordinal(date.getDate())} ${monthName(date)}`;
}

/** How a day went, in the words a day cell gives screen readers. Planned and rest days say so elsewhere. */
export function dayStatusWord(status: DayStatus) {
  return {
    completed: 'done',
    missed: 'missed',
    skipped: 'skipped',
    inProgress: 'in progress',
    planned: null,
    rest: null,
  }[status];
}

/** The small line and the title above a day. Another year says which. */
export function dayHeading(date: Date, today: string) {
  const titles: Record<number, string | undefined> = {
    [-1]: 'Yesterday',
    0: 'Today',
    1: 'Tomorrow',
  };
  const title = titles[daysFrom(today, dateText(date))];

  return title === undefined
    ? {
        label: [
          ordinal(date.getDate()),
          monthName(date),
          ...(String(date.getFullYear()) === today.slice(0, 4)
            ? []
            : [date.getFullYear()]),
        ].join(' '),
        title: dayNameOf(date).full,
      }
    : { label: shortWeekdayDate(date), title };
}
