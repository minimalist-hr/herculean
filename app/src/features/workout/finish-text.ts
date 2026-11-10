import type { components } from '@/api/schema';
import { counted, joined } from '@/formats/formats';

type Summary = components['schemas']['WorkoutSummaryResponse'];
type UncheckedExercise = components['schemas']['UncheckedExerciseResponse'];
type WorkoutRecord = components['schemas']['WorkoutRecordResponse'];
type FinishCounts = Pick<
  Summary,
  'setsChecked' | 'setsTotal' | 'uncheckedExercises'
>;

/** The counts behind the warning, from a workout's exercises, as the summary would give them. */
export function finishCounts(
  exercises: { name: string; sets: { checked: boolean }[] }[],
): FinishCounts {
  const sets = exercises.flatMap((exercise) => exercise.sets);

  return {
    setsChecked: sets.filter((set) => set.checked).length,
    setsTotal: sets.length,
    uncheckedExercises: exercises
      .map((exercise) => ({
        name: exercise.name,
        uncheckedSets: exercise.sets.filter((set) => !set.checked).length,
        sets: exercise.sets.length,
      }))
      .filter((exercise) => exercise.uncheckedSets > 0),
  };
}

/** Which of one exercise's sets aren't checked, for example "both sets". */
function whichSets({ uncheckedSets, sets }: UncheckedExercise) {
  if (uncheckedSets < sets || sets === 1) {
    return counted(uncheckedSets, 'set', 'sets');
  }

  return sets === 2 ? 'both sets' : `all ${String(sets)} sets`;
}

/** Where the unchecked sets are. More than two exercises would make it too long to read. */
function whereUnchecked(exercises: UncheckedExercise[]) {
  if (exercises.length > 2) {
    return `Across ${String(exercises.length)} exercises.`;
  }

  return exercises.length === 1
    ? `${exercises[0].name}, ${whichSets(exercises[0])}.`
    : `${joined(exercises.map((exercise) => exercise.name))}.`;
}

/** The warning above the tiles, or null with every set checked. */
export function finishWarning({
  setsChecked,
  setsTotal,
  uncheckedExercises,
}: FinishCounts) {
  if (setsChecked === 0) {
    return {
      title: 'No sets checked off',
      message:
        'There’s nothing to save. Go back and check off your sets, or discard the workout.',
    };
  }

  const unchecked = setsTotal - setsChecked;
  if (unchecked === 0) {
    return null;
  }

  return {
    title: `${counted(unchecked, 'set', 'sets')} not checked off`,
    message: `${whereUnchecked(uncheckedExercises)} ${
      unchecked === 1
        ? 'It won’t be saved unless you go back and check it off.'
        : 'They won’t be saved unless you go back and check them off.'
    }`,
  };
}

/** What the discard sheet says is at stake. */
export function discardMessage(setsChecked: number) {
  const lost =
    setsChecked === 0
      ? 'No sets are checked off.'
      : `Its ${counted(setsChecked, 'checked set', 'checked sets')} won’t be saved.`;

  return `${lost} You can undo this right after.`;
}

/** What a record beat. A bodyweight set has no weight to name. */
export function recordReason(
  { kind, weightKg }: WorkoutRecord,
  weight: string,
) {
  if (kind === 'heaviestWeight') {
    return 'Heaviest weight';
  }

  return weightKg === 0 ? 'Most reps' : `Most reps at ${weight}`;
}

const longWorkoutSeconds = 4 * 60 * 60;

/** A timer this long probably means Finish was forgotten. */
export function isLongWorkout(elapsedSeconds: number | null) {
  return elapsedSeconds !== null && elapsedSeconds >= longWorkoutSeconds;
}
