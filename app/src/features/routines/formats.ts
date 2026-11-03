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

export type Weekday = components['schemas']['Weekday'];

export const weekdays = Object.keys(dayNames) as Weekday[];

/** Says a routine was saved, and which days it took from other routines. */
export function savedMessage(
  saved: components['schemas']['RoutineSavedResponse'],
  verb: 'created' | 'saved',
) {
  const message = `${saved.name} ${verb}.`;
  const moved = saved.movedDays;
  if (moved.length === 0) {
    return message;
  }

  const days = joined(moved.map((day) => dayNames[day.weekday].full));
  const from = moved.every((day) => day.fromRoutine === moved[0].fromRoutine)
    ? moved[0].fromRoutine
    : 'other routines';

  return `${message} ${days} moved from ${from}.`;
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

/** Whether two neighbouring exercises read as one block, because they train the same group. */
export function sameGroup(
  above: { groupId: string },
  below: { groupId: string },
) {
  return above.groupId === below.groupId;
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
