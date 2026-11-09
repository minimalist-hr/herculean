import type { components } from '@/api/schema';
import { dayNames, joined } from '@/formats/formats';

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
