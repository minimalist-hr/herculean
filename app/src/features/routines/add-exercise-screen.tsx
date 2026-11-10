import { ExercisePicker } from '@/features/exercises/exercise-picker';

import { startingTargets, useRoutineDraft } from './routine-draft';

/** Picks exercises for a routine. */
export function AddExerciseScreen({ back }: { back: string }) {
  const { pages, exercises, setExercises, picked, setPicked, createdIds } =
    useRoutineDraft();

  return (
    <ExercisePicker
      back={back}
      subtitle="Pick the exercises to add to this routine."
      nothingToAdd="Create one to use it in this routine."
      excludedIds={exercises.map((exercise) => exercise.exerciseId)}
      picked={picked}
      setPicked={setPicked}
      createdIds={createdIds}
      newExercisePage={pages.newExercise}
      offersSuperset
      onDone={(leave, { asSuperset }) => {
        setExercises((current) => [
          ...current,
          ...picked.map((exercise, index) => ({
            exerciseId: exercise.id,
            name: exercise.name,
            groupId: exercise.groupId,
            groupName: exercise.groupName,
            ...startingTargets,
            supersetWithNext: asSuperset && index === 0,
          })),
        ]);
        leave();
      }}
    />
  );
}
