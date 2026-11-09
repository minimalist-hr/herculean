import type { components } from '@/api/schema';
import { counted, formatVolume, minutesText } from '@/formats/formats';

type Summary = components['schemas']['WorkoutSummaryResponse'];
type Exercise = components['schemas']['WorkoutExerciseResponse'];
type Units = components['schemas']['Units'];
type Workout = components['schemas']['WorkoutDetailsResponse'];

/** What an exercise comes to: its volume, or its reps when it is done with bodyweight only. */
export function exerciseTotal({ sets }: Exercise, units: Units) {
  const volumeKg = sets.reduce((sum, set) => sum + set.weightKg * set.reps, 0);
  if (volumeKg > 0) {
    return formatVolume(volumeKg, units);
  }

  return counted(
    sets.reduce((sum, set) => sum + set.reps, 0),
    'rep',
    'reps',
  );
}

/** A saved workout's exercises, with what was actually done, for example "3 sets · 990 kg". */
export function savedExercises(workout: Workout, units: Units) {
  return workout.exercises.map((exercise) => ({
    ...exercise,
    done: `${counted(exercise.sets.length, 'set', 'sets')} · ${exerciseTotal(exercise, units)}`,
  }));
}

/** The line under a saved workout's name. A past day logged later has no time. */
export function savedMeta(exercises: number, summary?: Summary) {
  const parts = [counted(exercises, 'exercise', 'exercises')];
  if (summary !== undefined) {
    parts.push(counted(summary.setsChecked, 'set', 'sets'));
    if (summary.durationSeconds !== null) {
      parts.push(minutesText(summary.durationSeconds));
    }
  }

  return parts.join(' · ');
}
