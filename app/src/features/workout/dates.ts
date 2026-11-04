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

/** How far ahead the week strip and the month reach. */
export const weeksAhead = 4;

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

/** The last day the user can reach: the end of the week, some weeks from now. */
export function lastDayReached(now: Date) {
  return addDays(weekOf(now)[0], weeksAhead * 7 + 6);
}

/** A month as the API reads it, for example "2026-10". */
export function monthText(date: Date) {
  return dateText(date).slice(0, 7);
}

export function addMonths(month: string, count: number) {
  const first = dateFromText(`${month}-01`);

  return monthText(new Date(first.getFullYear(), first.getMonth() + count, 1));
}

/** Every date of a month, in order. */
export function monthDates(month: string) {
  const first = dateFromText(`${month}-01`);
  const count = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0,
  ).getDate();

  return Array.from({ length: count }, (_, index) => addDays(first, index));
}

export function monthName(date: Date) {
  return months[date.getMonth()];
}

/** A month in words, for example "October 2026". */
export function monthTitle(month: string) {
  const first = dateFromText(`${month}-01`);

  return `${monthName(first)} ${String(first.getFullYear())}`;
}

function ordinal(day: number) {
  const lastTwo = day % 100;
  if (lastTwo >= 11 && lastTwo <= 13) {
    return `${String(day)}th`;
  }

  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] ?? 'th';

  return `${String(day)}${suffix}`;
}

/** A date with a short weekday, for example "Sun, 25th October". */
export function shortWeekdayDate(date: Date) {
  return `${dayNameOf(date).short}, ${ordinal(date.getDate())} ${months[date.getMonth()]}`;
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
    : { label: shortWeekdayDate(date), title };
}
