const monthNames = [
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

/** Steps that read well on a weight axis, smallest first. */
const steps = [0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500];

/** At most this many gaps between grid lines, so the labels don't crowd. */
const maxGaps = 3;

/** At most this many month labels under the chart. */
const maxMonthLabels = 4;

/** The weights the grid lines sit on, lowest first: round numbers around every value. */
export function weightTicks(values: number[]) {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const step =
    steps.find(
      (candidate) =>
        Math.ceil(high / candidate) - Math.floor(low / candidate) <= maxGaps,
    ) ?? steps[steps.length - 1];
  const first = Math.floor(low / step) * step;
  // A flat line still gets a gap above it, so it doesn't sit on the edge.
  const last = Math.max(Math.ceil(high / step) * step, first + step);

  const ticks: number[] = [];
  for (let tick = first; tick <= last + step / 2; tick += step) {
    ticks.push(Math.round(tick * 10) / 10);
  }

  return ticks;
}

/** Days since 1970 for a date from the API, so dates can be spaced by time. */
export function dayNumber(date: string) {
  const [year, month, day] = date.split('-').map(Number);

  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/**
 * Where each month starts between two dates, as labels to put under the chart.
 * Over a year, only years are labelled, where each one starts. Long ranges skip some, so at most four show.
 */
export function monthLabels(first: string, last: string) {
  const [firstYear, firstMonth] = first.split('-').map(Number);
  const starts: { day: number; year: number; month: number }[] = [];

  for (
    let year = firstYear, month = firstMonth;
    dayNumber(monthStart(year, month)) <= dayNumber(last);
    month === 12 ? ((year += 1), (month = 1)) : (month += 1)
  ) {
    const day = dayNumber(monthStart(year, month));
    if (day >= dayNumber(first)) {
      starts.push({ day, year, month });
    }
  }

  // A range inside one month still says which month it is.
  if (starts.length === 0) {
    return [{ day: dayNumber(first), label: monthNames[firstMonth - 1] }];
  }

  const byYear = starts.length > 12;
  const shown = (
    byYear ? starts.filter((start) => start.month === 1) : starts
  ).map((start) => ({
    day: start.day,
    label: byYear ? String(start.year) : monthNames[start.month - 1],
  }));
  const every = Math.ceil(shown.length / maxMonthLabels);

  return shown.filter((_, index) => index % every === 0);
}

function monthStart(year: number, month: number) {
  return `${String(year)}-${String(month).padStart(2, '0')}-01`;
}
