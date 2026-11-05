import type { components } from '@/api/schema';

type WorkoutExercise = components['schemas']['WorkoutExerciseResponse'];

export function checkedSets(exercise: { sets: { checked: boolean }[] }) {
  return exercise.sets.filter((set) => set.checked).length;
}

export function isFinished(exercise: { sets: { checked: boolean }[] }) {
  return exercise.sets.every((set) => set.checked);
}

/** How many sets are checked, out of all of them. */
export function workoutProgress(exercises: { sets: { checked: boolean }[] }[]) {
  return {
    done: exercises.reduce((sum, exercise) => sum + checkedSets(exercise), 0),
    total: exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0),
  };
}

/** A workout's set count in words, for example "7 of 19 sets". */
export function progressText({ done, total }: { done: number; total: number }) {
  return `${String(done)} of ${String(total)} sets`;
}

/** The exercise that opens next: the first unfinished one after this one, then the first unfinished one at all. */
export function nextUnfinished(exercises: WorkoutExercise[], afterId: string) {
  const after = exercises.findIndex((exercise) => exercise.id === afterId);

  return (
    exercises.slice(after + 1).find((exercise) => !isFinished(exercise)) ??
    exercises.find((exercise) => !isFinished(exercise))
  );
}
