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
