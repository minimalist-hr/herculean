import type { components } from '@/api/schema';

export const dayNames: Record<
  components['schemas']['Weekday'],
  { full: string; short: string }
> = {
  monday: { full: 'Monday', short: 'Mon' },
  tuesday: { full: 'Tuesday', short: 'Tue' },
  wednesday: { full: 'Wednesday', short: 'Wed' },
  thursday: { full: 'Thursday', short: 'Thu' },
  friday: { full: 'Friday', short: 'Fri' },
  saturday: { full: 'Saturday', short: 'Sat' },
  sunday: { full: 'Sunday', short: 'Sun' },
};

/** A count with its word, for example "1 set" or "19 sets". */
export function counted(count: number, one: string, many: string) {
  return `${String(count)} ${count === 1 ? one : many}`;
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
