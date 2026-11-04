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

/** A date the API sent, in the phone's time zone. */
export function dateFromText(text: string) {
  const [year, month, day] = text.split('-').map(Number);

  return new Date(year, month - 1, day);
}

/** How many days a date is after another. Negative when it is before. */
export function daysFrom(from: string, to: string) {
  const dayNumber = (text: string) => {
    const date = dateFromText(text);

    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  };

  return Math.round((dayNumber(to) - dayNumber(from)) / 86_400_000);
}

export function dayNameOf(date: Date) {
  return dayNames[weekdays[(date.getDay() + 6) % 7]];
}

export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
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

/** A date in few words, for example "Mon, 26th Oct". */
export function shortDate(date: Date) {
  return `${dayNameOf(date).short}, ${ordinal(date.getDate())} ${months[date.getMonth()].slice(0, 3)}`;
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
          months[date.getMonth()],
          ...(String(date.getFullYear()) === today.slice(0, 4)
            ? []
            : [date.getFullYear()]),
        ].join(' '),
        title: dayNameOf(date).full,
      }
    : { label: longDate(date), title };
}
